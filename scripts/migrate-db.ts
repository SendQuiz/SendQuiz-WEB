import crypto from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
import type { Connection, RowDataPacket } from 'mysql2/promise';

type Migration = {
  checksum: string;
  name: string;
  sql: string;
};

type LockRow = RowDataPacket & {
  locked: number;
};

type MigrationRow = RowDataPacket & {
  MIGRATION_NAME: string;
};

type CountRow = RowDataPacket & {
  count: number;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..');
const migrationsDir = resolve(appDir, 'database/migrations');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const baselineThrough = readArgValue('--baseline-through');

nextEnv.loadEnvConfig(appDir);

const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => {
    const sql = readFileSync(resolve(migrationsDir, name), 'utf8');
    return { name, sql, checksum: checksum(sql) };
  });

const connection = await mysql.createConnection({
  host: requiredEnv('DB_HOST'),
  user: requiredEnv('DB_USER'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true,
  ssl: process.env.DB_SSL === 'amazon-rds' ? 'Amazon RDS' : undefined,
  timezone: 'Z',
});

try {
  await connection.query("SET time_zone = '+00:00'");
  await acquireMigrationLock(connection);
  await ensureLedger(connection);

  if (baselineThrough) {
    await baselineMigrations(connection, baselineThrough);
  }

  const applied = await readAppliedMigrations(connection);
  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    if (await shouldSkipMigration(connection, migration.name)) {
      await recordMigration(connection, migration);
      console.log(`[db:migrate] skip ${migration.name}`);
      continue;
    }

    console.log(`[db:migrate] apply ${migration.name}`);
    if (!dryRun) {
      await connection.query(migration.sql);
      await recordMigration(connection, migration);
    }
  }
} finally {
  await connection.query("SELECT RELEASE_LOCK('send_schema_migrations')");
  await connection.end();
}

function readArgValue(name: string) {
  const prefix = `${name}=`;
  const arg = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function checksum(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function acquireMigrationLock(connection: Connection) {
  const [rows] = await connection.query<LockRow[]>("SELECT GET_LOCK('send_schema_migrations', 30) AS locked");
  if (rows[0]?.locked !== 1) throw new Error('failed to acquire migration lock');
}

async function ensureLedger(connection: Connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS SCHEMA_MIGRATIONS (
      ID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      MIGRATION_NAME VARCHAR(255) NOT NULL,
      CHECKSUM CHAR(64) NOT NULL,
      APPLIED_AT TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ID),
      UNIQUE KEY UQ_SCHEMA_MIGRATIONS_NAME (MIGRATION_NAME)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function readAppliedMigrations(connection: Connection) {
  const [rows] = await connection.query<MigrationRow[]>('SELECT MIGRATION_NAME FROM SCHEMA_MIGRATIONS');
  return new Set(rows.map((row) => row.MIGRATION_NAME));
}

async function baselineMigrations(connection: Connection, lastMigrationName: string) {
  for (const migration of migrations) {
    await recordMigration(connection, migration);
    console.log(`[db:migrate] baseline ${migration.name}`);
    if (migration.name === lastMigrationName) return;
  }
  throw new Error(`baseline target not found: ${lastMigrationName}`);
}

async function recordMigration(connection: Connection, migration: Migration) {
  if (dryRun) return;
  await connection.query(
    `
      INSERT INTO SCHEMA_MIGRATIONS (MIGRATION_NAME, CHECKSUM)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE CHECKSUM = VALUES(CHECKSUM)
    `,
    [migration.name, migration.checksum],
  );
}

async function shouldSkipMigration(connection: Connection, migrationName: string) {
  if (migrationName !== '011_REPLACE_COGNITO_USERS_WITH_LOCAL_AUTH.sql') return false;
  const [rows] = await connection.query<CountRow[]>(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'USERS'
        AND COLUMN_NAME = 'COGNITO_SUB'
    `,
  );
  return Number(rows[0]?.count || 0) === 0;
}
