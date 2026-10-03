import type { NextApiRequest } from "next";

type RequestSource = "body" | "query";

function readValue(req: NextApiRequest, source: RequestSource, key: string) {
  const value = req[source]?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function readString(req: NextApiRequest, source: RequestSource, key: string, { trim = true } = {}) {
  const value = String(readValue(req, source, key) ?? "");
  return trim ? value.trim() : value;
}

function readBodyString(req: NextApiRequest, key: string, options?: { trim?: boolean }) {
  return readString(req, "body", key, options);
}

function readQueryString(req: NextApiRequest, key: string, options?: { trim?: boolean }) {
  return readString(req, "query", key, options);
}

function readEmail(req: NextApiRequest, source: RequestSource, key: string) {
  return readString(req, source, key).toLowerCase();
}

function readBodyArray(req: NextApiRequest, key: string) {
  const value = readValue(req, "body", key);
  return Array.isArray(value) ? value : [];
}

export { readBodyArray, readBodyString, readEmail, readQueryString };
