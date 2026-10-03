import { getUserById } from "../models/userModel";
import type { ApiRequest, ApiResponse } from "../types/api";
import { API_MESSAGES } from "../utils/messages";
import { readBodyString, readEmail } from "../utils/request";
import { hasMinimumPasswordLength } from "../utils/secrets";

function parsePositiveId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function requireAuthenticatedUserId(req: ApiRequest, res: ApiResponse) {
  const userId = parsePositiveId(req.user?.userId);
  if (userId) return userId;

  res.status(401).json(API_MESSAGES.UNAUTHORIZED);
  return null;
}

async function requireCurrentUser(req: ApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return null;

  const user = await getUserById(userId);
  if (user?.ID) return user;

  res.status(401).json(API_MESSAGES.USER_NOT_FOUND);
  return null;
}

function requireRouteId(req: ApiRequest, res: ApiResponse, key: string, notFoundMessage: unknown) {
  const value = req.params?.[key];
  const id = parsePositiveId(value);
  if (id) return id;

  res.status(404).json(notFoundMessage);
  return null;
}

function requireBodyString(
  req: ApiRequest,
  res: ApiResponse,
  key: string,
  badRequestMessage: unknown,
  options?: { trim?: boolean }
) {
  const value = readBodyString(req, key, options);
  if (value) return value;

  res.status(400).json(badRequestMessage);
  return null;
}

function requireBodyEmail(req: ApiRequest, res: ApiResponse, key: string, badRequestMessage: unknown) {
  const value = readEmail(req, "body", key);
  if (value) return value;

  res.status(400).json(badRequestMessage);
  return null;
}

function requireBodyPassword(req: ApiRequest, res: ApiResponse, key: string, badRequestMessage: unknown) {
  const password = requireBodyString(req, res, key, badRequestMessage, { trim: false });
  if (!password) return null;
  if (hasMinimumPasswordLength(password)) return password;

  res.status(400).json(API_MESSAGES.PASSWORD_TOO_SHORT);
  return null;
}

export {
  requireAuthenticatedUserId,
  requireBodyEmail,
  requireBodyPassword,
  requireBodyString,
  requireCurrentUser,
  requireRouteId,
};
