import mysql from "mysql2/promise";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

function resolveSsl() {
  const value = String(process.env.DB_SSL || "").trim().toLowerCase();
  if (!value) return undefined;
  if (value === "amazon-rds") return "Amazon RDS";
  return { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: resolveSsl(),
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

type QueryExecutor = Pool | PoolConnection;

type QueryClient = {
  queryFirst<T extends RowDataPacket = RowDataPacket>(sql: string, values?: unknown[]): Promise<T | null>;
  queryResult(sql: string, values?: unknown[]): Promise<ResultSetHeader>;
  queryRows<T extends RowDataPacket = RowDataPacket>(sql: string, values?: unknown[]): Promise<T[]>;
};

function createQueryClient(executor: QueryExecutor): QueryClient {
  async function queryRows<T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []): Promise<T[]> {
    const [rows] = await executor.execute<T[]>(sql, values);
    return rows;
  }

  async function queryFirst<T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []): Promise<T | null> {
    const rows = await queryRows<T>(sql, values);
    return rows[0] ?? null;
  }

  async function queryResult(sql: string, values: unknown[] = []): Promise<ResultSetHeader> {
    const [result] = await executor.execute<ResultSetHeader>(sql, values);
    return result;
  }

  return {
    queryFirst,
    queryResult,
    queryRows,
  };
}

const queries = createQueryClient(pool);

async function withTransaction<T>(run: (tx: QueryClient) => Promise<T>) {
  const connection = await pool.getConnection();
  const tx = createQueryClient(connection);

  try {
    await connection.beginTransaction();
    const result = await run(tx);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const { queryFirst, queryResult, queryRows } = queries;

export { queryFirst, queryResult, queryRows, withTransaction };
export type { QueryClient };
