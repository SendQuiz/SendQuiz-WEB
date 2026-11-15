import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cache = new Map<string, string>();

function loadQuery(fileName: string) {
  const fullPath = resolve(process.cwd(), "database/queries", fileName);
  if (!cache.has(fullPath)) {
    const sql = readFileSync(fullPath, "utf8");
    cache.set(fullPath, sql.trim());
  }
  return cache.get(fullPath) ?? "";
}

export { loadQuery };
