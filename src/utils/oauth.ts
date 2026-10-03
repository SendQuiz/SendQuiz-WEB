import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "jose";

import { createHttpError } from "./httpError";
import { isJsonObject, readJson } from "./json";

const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_ISSUER = "https://accounts.google.com";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

const APPLE_AUTHORIZATION_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

function createOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}

type OAuthProvider = "apple" | "google";

type OAuthConfig = {
  authorizationUrl: string;
  clientId: string;
  clientSecret: string;
  issuer: string;
  jwksUrl: string;
  scopes: string;
  tokenUrl: string;
};

type TokenPayload = JWTPayload & {
  access_token?: string;
  email?: string;
  email_verified?: boolean | number | string;
  id_token?: string;
};

function tokenPayloadFromUnknown(value: unknown): TokenPayload {
  if (!isJsonObject(value)) return {};

  return {
    ...value,
    access_token: typeof value.access_token === "string" ? value.access_token : undefined,
    email: typeof value.email === "string" ? value.email : undefined,
    email_verified: value.email_verified as TokenPayload["email_verified"],
    id_token: typeof value.id_token === "string" ? value.id_token : undefined,
    sub: typeof value.sub === "string" ? value.sub : undefined,
  };
}

function hashToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getBaseUrl() {
  return (process.env.AUTH_BASE_URL || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || "https://sendquiz.net").replace(/\/+$/, "");
}

function isDevOAuthBaseUrl() {
  return new URL(getBaseUrl()).hostname === "dev.sendquiz.net";
}

function readOAuthEnv(name: string) {
  return process.env[name] || "";
}

function readScopedOAuthEnv(provider: Uppercase<OAuthProvider>, name: string, allowDefaultFallback = false) {
  const prefix = isDevOAuthBaseUrl() ? `${provider}_OAUTH_DEV_` : `${provider}_OAUTH_`;
  const value = readOAuthEnv(`${prefix}${name}`);
  if (value || !allowDefaultFallback) return value;
  return readOAuthEnv(`${provider}_OAUTH_${name}`);
}

function normalizeProvider(value: unknown): OAuthProvider | null {
  const provider = String(value || "").toLowerCase();
  return provider === "google" || provider === "apple" ? provider : null;
}

function safeRedirectPath(value: unknown) {
  const path = String(value || "/auth").trim();
  return path.startsWith("/") && !path.startsWith("//") ? path : "/auth";
}

function safeMobileReturnUri(value: unknown) {
  const uri = String(value || "").trim();
  return uri === "send://auth/oauth" ? uri : "";
}

function mobileReturnUrl(value: string, code: string) {
  const url = new URL(value);
  url.searchParams.set("code", code);
  return url.toString();
}

function callbackUrlFor(provider: OAuthProvider) {
  return `${getBaseUrl()}/api/auth/oauth/web/${provider}/callback`;
}

function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  if (provider === "google") {
    const clientId = readScopedOAuthEnv("GOOGLE", "CLIENT_ID");
    const clientSecret = readScopedOAuthEnv("GOOGLE", "CLIENT_SECRET");
    if (!clientId || !clientSecret) throw createHttpError("GOOGLE_OAUTH_CONFIG_MISSING", 500);
    return {
      authorizationUrl: GOOGLE_AUTHORIZATION_URL,
      clientId,
      clientSecret,
      issuer: GOOGLE_ISSUER,
      jwksUrl: GOOGLE_JWKS_URL,
      scopes: "openid email profile",
      tokenUrl: GOOGLE_TOKEN_URL,
    };
  }

  const clientId = readScopedOAuthEnv("APPLE", "CLIENT_ID");
  const teamId = readScopedOAuthEnv("APPLE", "TEAM_ID", true);
  const keyId = readScopedOAuthEnv("APPLE", "KEY_ID", true);
  const privateKey = readScopedOAuthEnv("APPLE", "PRIVATE_KEY", true).replace(/\\n/g, "\n");
  if (!clientId || !teamId || !keyId || !privateKey) throw createHttpError("APPLE_OAUTH_CONFIG_MISSING", 500);

  return {
    authorizationUrl: APPLE_AUTHORIZATION_URL,
    clientId,
    clientSecret: jwt.sign({}, privateKey, {
      algorithm: "ES256",
      audience: APPLE_ISSUER,
      expiresIn: "10m",
      issuer: teamId,
      keyid: keyId,
      subject: clientId,
    }),
    issuer: APPLE_ISSUER,
    jwksUrl: APPLE_JWKS_URL,
    scopes: "openid email name",
    tokenUrl: APPLE_TOKEN_URL,
  };
}

function buildAuthorizationUrl({
  provider,
  state,
  nonce,
  redirectUri,
}: {
  provider: OAuthProvider;
  state: string;
  nonce: string;
  redirectUri: string;
}) {
  const config = getOAuthConfig(provider);
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  if (provider === "google") {
    url.searchParams.set("prompt", "select_account");
  } else {
    url.searchParams.set("response_mode", "form_post");
  }

  return url.toString();
}

async function exchangeCodeForToken({
  provider,
  code,
  redirectUri,
}: {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}) {
  const config = getOAuthConfig(provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = tokenPayloadFromUnknown(await readJson(response));
  if (!response.ok || !payload?.id_token) throw createHttpError("OAUTH_TOKEN_EXCHANGE_FAILED", 401);
  return payload;
}

async function verifyIdToken({
  provider,
  idToken,
  expectedNonceHash,
}: {
  provider: OAuthProvider;
  idToken: string;
  expectedNonceHash: string;
}) {
  const config = getOAuthConfig(provider);
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  const jwks = createRemoteJWKSet(new URL(config.jwksUrl));
  const { payload } = await jwtVerify(idToken, jwks, {
    audience: config.clientId,
    issuer: config.issuer,
  });

  const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
  if (!nonce || hashToken(nonce) !== expectedNonceHash) throw createHttpError("OAUTH_NONCE_MISMATCH", 401);
  return payload;
}

async function readGoogleProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw createHttpError("OAUTH_PROFILE_FETCH_FAILED", 401);
  return tokenPayloadFromUnknown(await readJson(response));
}

function normalizeEmailVerified(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

async function readOAuthIdentity({
  provider,
  tokenPayload,
}: {
  provider: OAuthProvider;
  tokenPayload: TokenPayload;
}) {
  const subject = String(tokenPayload.sub || "");
  if (!subject) throw createHttpError("OAUTH_SUBJECT_MISSING", 401);

  return {
    email: typeof tokenPayload.email === "string" ? tokenPayload.email.toLowerCase() : "",
    emailVerified: normalizeEmailVerified(tokenPayload.email_verified),
    provider,
    providerUserId: subject,
  };
}

export {
  buildAuthorizationUrl,
  callbackUrlFor,
  createHttpError,
  createOpaqueToken,
  exchangeCodeForToken,
  getOAuthConfig,
  hashToken,
  mobileReturnUrl,
  normalizeProvider,
  readGoogleProfile,
  readOAuthIdentity,
  safeMobileReturnUri,
  safeRedirectPath,
  verifyIdToken,
};
