import { getUserById } from "@/lib/users/queries";
import type { RequestContext } from "@/lib/http/types";
import { API_MESSAGES } from "@/lib/http/messages";
import { readBodyString, readEmail } from "@/lib/http/request";
import { hasMinimumPasswordLength } from "@/lib/auth/secrets";

function parsePositiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function requireAuthenticatedUserId(req: RequestContext) {
  const userId = parsePositiveId(req.user?.userId);
  if (userId) return userId;

  throw Response.json(API_MESSAGES.UNAUTHORIZED, { status: 401 });
}

async function requireCurrentUser(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const user = await getUserById(userId);
  if (user?.ID) return user;

  throw Response.json(API_MESSAGES.USER_NOT_FOUND, { status: 401 });
}

function requireRouteId(req: RequestContext, key: string, notFoundMessage: unknown) {
  const value = req.params?.[key];
  const id = parsePositiveId(value);
  if (id) return id;

  throw Response.json(notFoundMessage, { status: 404 });
}

function requireBodyString(
  req: RequestContext,
  key: string,
  badRequestMessage: unknown,
  options?: { trim?: boolean }
) {
  const value = readBodyString(req, key, options);
  if (value) return value;

  throw Response.json(badRequestMessage, { status: 400 });
}

function requireBodyEmail(req: RequestContext, key: string, badRequestMessage: unknown) {
  const value = readEmail(req, "body", key);
  if (value) return value;

  throw Response.json(badRequestMessage, { status: 400 });
}

function requireBodyPassword(req: RequestContext, key: string, badRequestMessage: unknown) {
  const password = requireBodyString(req, key, badRequestMessage, { trim: false });
  if (hasMinimumPasswordLength(password)) return password;

  throw Response.json(API_MESSAGES.PASSWORD_TOO_SHORT, { status: 400 });
}

export {
  requireAuthenticatedUserId,
  requireBodyEmail,
  requireBodyPassword,
  requireBodyString,
  requireCurrentUser,
  requireRouteId,
};
