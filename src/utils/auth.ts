import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

import { createHttpError, getHttpStatus } from "./httpError";
import { API_MESSAGES } from "./messages";
import { queryFirst } from "./db";
import type { ApiNext, ApiRequest, ApiResponse } from "../types/api";

const DEFAULT_TOKEN_EXPIRES_IN = "30d";

type AuthTokenUser = {
  ID: number | string;
  EMAIL: string;
  TOKEN_VERSION?: number | string | null;
};

type TokenVersionRow = RowDataPacket & {
  TOKEN_VERSION: number;
};

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw createHttpError("AUTH_JWT_SECRET_MISSING", 500);
  }
  return secret;
}

function parsePositiveUserId(value: unknown) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

async function readCurrentTokenVersion(userId: number) {
  const user = await queryFirst<TokenVersionRow>("SELECT TOKEN_VERSION FROM USERS WHERE ID = ? LIMIT 1", [userId]);
  return user ? Number(user.TOKEN_VERSION) : null;
}

function signAuthToken(user: AuthTokenUser) {
  const expiresIn = (process.env.AUTH_JWT_EXPIRES_IN || DEFAULT_TOKEN_EXPIRES_IN) as SignOptions["expiresIn"];

  return jwt.sign(
    {
      userId: Number(user.ID),
      email: user.EMAIL,
      tokenVersion: Number(user.TOKEN_VERSION ?? 0),
    },
    getJwtSecret(),
    { expiresIn }
  );
}

function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

function getBearerToken(req: ApiRequest) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function authenticate(req: ApiRequest, res: ApiResponse, next: ApiNext) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json(API_MESSAGES.UNAUTHORIZED);

    const payload = verifyAuthToken(token);
    const userId = parsePositiveUserId(payload?.userId);
    if (!userId) return res.status(401).json(API_MESSAGES.UNAUTHORIZED);

    const tokenVersion = await readCurrentTokenVersion(userId);
    if (tokenVersion == null) return res.status(401).json(API_MESSAGES.UNAUTHORIZED);
    if (Number(payload.tokenVersion ?? 0) !== tokenVersion) return res.status(401).json(API_MESSAGES.UNAUTHORIZED);

    req.user = payload;
    return next();
  } catch (error) {
    if (getHttpStatus(error) === 500) return res.status(500).json(API_MESSAGES.INTERNAL_SERVER_ERROR);
    return res.status(401).json(API_MESSAGES.UNAUTHORIZED);
  }
}

export { authenticate, signAuthToken };
