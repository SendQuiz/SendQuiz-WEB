import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";

import { createHttpError } from "@/lib/http/error";
import { API_MESSAGES } from "@/lib/http/messages";
import { queryFirst } from "@/lib/db/client";

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

async function authenticate(headers: Headers) {
  const token = headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw Response.json(API_MESSAGES.UNAUTHORIZED, { status: 401 });

  try {
    const payload = verifyAuthToken(token);
    const userId = parsePositiveUserId(payload?.userId);
    if (!userId) throw Response.json(API_MESSAGES.UNAUTHORIZED, { status: 401 });
    const tokenVersion = await readCurrentTokenVersion(userId);
    if (tokenVersion == null || Number(payload.tokenVersion ?? 0) !== tokenVersion) {
      throw Response.json(API_MESSAGES.UNAUTHORIZED, { status: 401 });
    }
    return payload;
  } catch (error) {
    if (error instanceof Response) throw error;
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw Response.json(API_MESSAGES.UNAUTHORIZED, { status: 401 });
    }
    throw error;
  }
}

export { authenticate, signAuthToken };
