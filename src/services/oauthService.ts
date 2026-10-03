import {
  consumeMobileOAuthCode,
  consumeOAuthRequest,
  createMobileOAuthCode,
  createOrLinkOAuthUser,
  createOAuthRequest,
} from "../models/oauthModel";
import {
  buildAuthorizationUrl,
  callbackUrlFor,
  createHttpError,
  createOpaqueToken,
  exchangeCodeForToken,
  hashToken,
  mobileReturnUrl,
  readGoogleProfile,
  readOAuthIdentity,
  safeMobileReturnUri,
  safeRedirectPath,
  verifyIdToken,
} from "../utils/oauth";

type OAuthProvider = "apple" | "google";
type OAuthIdentity = {
  email: string;
  emailVerified: boolean;
  provider: OAuthProvider;
  providerUserId: string;
};

type ResolveOAuthUserParams = {
  code: string;
  expectedNonceHash: string;
  provider: OAuthProvider;
  redirectUri: string;
};

type StartWebOAuthParams = {
  mobileReturnUri: unknown;
  provider: OAuthProvider;
  redirectPath: unknown;
};

function requireVerifiedOAuthIdentity(identity: OAuthIdentity) {
  if (!identity.email || !identity.emailVerified) throw createHttpError("OAUTH_EMAIL_NOT_VERIFIED", 401);
  return identity;
}

function requireGoogleAccessToken(accessToken: string | undefined) {
  if (!accessToken) throw createHttpError("OAUTH_TOKEN_EXCHANGE_FAILED", 401);
  return accessToken;
}

async function resolveOAuthUser({ provider, code, redirectUri, expectedNonceHash }: ResolveOAuthUserParams) {
  const tokenPayload = await exchangeCodeForToken({ provider, code, redirectUri });
  if (!tokenPayload.id_token) throw createHttpError("OAUTH_TOKEN_EXCHANGE_FAILED", 401);

  const verifiedPayload = await verifyIdToken({
    expectedNonceHash,
    idToken: tokenPayload.id_token,
    provider,
  });
  const profile = provider === "google"
    ? await readGoogleProfile(requireGoogleAccessToken(tokenPayload.access_token))
    : verifiedPayload;
  const identity = requireVerifiedOAuthIdentity(await readOAuthIdentity({ provider, tokenPayload: profile }));
  return createOrLinkOAuthUser({
    ...identity,
    nickname: identity.email.split("@")[0],
  });
}

async function startWebOAuthRequest({ provider, redirectPath, mobileReturnUri }: StartWebOAuthParams) {
  const state = createOpaqueToken();
  const nonce = createOpaqueToken();
  const redirectUri = callbackUrlFor(provider);
  await createOAuthRequest({
    mobileReturnUri: safeMobileReturnUri(mobileReturnUri),
    nonceHash: hashToken(nonce),
    provider,
    redirectPath: safeRedirectPath(redirectPath),
    redirectUri,
    stateHash: hashToken(state),
  });

  return buildAuthorizationUrl({ provider, redirectUri, state, nonce });
}

async function consumeWebOAuthRequest(provider: OAuthProvider, state: string) {
  const authRequest = await consumeOAuthRequest(hashToken(state));
  if (!authRequest || authRequest.PROVIDER !== provider) return null;
  return authRequest;
}

async function exchangeMobileOAuthCode(code: string) {
  return consumeMobileOAuthCode(hashToken(code));
}

async function createMobileOAuthReturnCode({ provider, userId }: { provider: OAuthProvider; userId: number }) {
  const mobileCode = createOpaqueToken();
  await createMobileOAuthCode({
    codeHash: hashToken(mobileCode),
    provider,
    userId,
  });
  return mobileCode;
}

async function createMobileOAuthReturnUrl({ provider, returnUri, userId }: {
  provider: OAuthProvider;
  returnUri: string;
  userId: number;
}) {
  const mobileCode = await createMobileOAuthReturnCode({ provider, userId });
  return mobileReturnUrl(returnUri, mobileCode);
}

export {
  createMobileOAuthReturnUrl,
  consumeWebOAuthRequest,
  exchangeMobileOAuthCode,
  resolveOAuthUser,
  startWebOAuthRequest,
};
