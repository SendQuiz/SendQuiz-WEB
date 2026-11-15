import type { RequestContext } from "../types/api";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function isRateLimited({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

function readClientIp(req: RequestContext) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function rateLimitKey(req: RequestContext, scope: string, identifier = "") {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  return [scope, readClientIp(req), normalizedIdentifier].join(":");
}

export { isRateLimited, rateLimitKey };
