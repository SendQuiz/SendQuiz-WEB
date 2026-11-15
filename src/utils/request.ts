import type { RequestContext } from "../types/api";

type RequestSource = "body" | "query";

function readValue(req: RequestContext, source: RequestSource, key: string) {
  const value = source === "query" ? req.query.get(key) : req.body[key];
  return Array.isArray(value) ? value[0] : value;
}

function readString(req: RequestContext, source: RequestSource, key: string, { trim = true } = {}) {
  const value = String(readValue(req, source, key) ?? "");
  return trim ? value.trim() : value;
}

function readBodyString(req: RequestContext, key: string, options?: { trim?: boolean }) {
  return readString(req, "body", key, options);
}

function readQueryString(req: RequestContext, key: string, options?: { trim?: boolean }) {
  return readString(req, "query", key, options);
}

function readEmail(req: RequestContext, source: RequestSource, key: string) {
  return readString(req, source, key).toLowerCase();
}

function readBodyArray(req: RequestContext, key: string) {
  const value = req.body[key];
  return Array.isArray(value) ? value : [];
}

export { readBodyArray, readBodyString, readEmail, readQueryString };
