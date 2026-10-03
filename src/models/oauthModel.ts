import { queryFirst, queryResult, withTransaction } from "../utils/db";
import { loadQuery } from "../utils/sql";
import type { UserRow } from "./userModel";
import type { RowDataPacket } from "mysql2";

const INSERT_USER_OAUTH = loadQuery("USERS_INSERT_OAUTH.sql");
const SELECT_USER_BY_ID = loadQuery("USERS_SELECT_BY_ID.sql");
const SELECT_USER_BY_EMAIL = loadQuery("USERS_SELECT_BY_EMAIL.sql");
const SELECT_AUTH_IDENTITY_BY_PROVIDER_USER = loadQuery("AUTH_IDENTITIES_SELECT_BY_PROVIDER_USER.sql");
const INSERT_AUTH_IDENTITY = loadQuery("AUTH_IDENTITIES_INSERT.sql");
const INSERT_OAUTH_REQUEST = loadQuery("AUTH_OAUTH_REQUESTS_INSERT.sql");
const CONSUME_OAUTH_REQUEST = loadQuery("AUTH_OAUTH_REQUESTS_CONSUME.sql");
const SELECT_OAUTH_REQUEST_BY_STATE_HASH = loadQuery("AUTH_OAUTH_REQUESTS_SELECT_BY_STATE_HASH.sql");
const INSERT_MOBILE_OAUTH_CODE = loadQuery("AUTH_MOBILE_OAUTH_CODES_INSERT.sql");
const CONSUME_MOBILE_OAUTH_CODE = loadQuery("AUTH_MOBILE_OAUTH_CODES_CONSUME.sql");
const SELECT_MOBILE_OAUTH_CODE_BY_CODE_HASH = loadQuery("AUTH_MOBILE_OAUTH_CODES_SELECT_BY_CODE_HASH.sql");

type OAuthRequestRow = RowDataPacket & {
  MOBILE_RETURN_URI?: string | null;
  NONCE_HASH: string;
  PROVIDER: string;
  REDIRECT_PATH: string;
  REDIRECT_URI: string;
};

type OAuthIdentityParams = {
  provider: string;
  providerUserId: string;
};

type CreateOrLinkOAuthUserParams = OAuthIdentityParams & {
  email: string;
  emailVerified: boolean;
  nickname: string | null;
};

type CreateOAuthRequestParams = {
  mobileReturnUri: string | null;
  nonceHash: string;
  provider: string;
  redirectPath: string;
  redirectUri: string;
  stateHash: string;
};

type CreateMobileOAuthCodeParams = {
  codeHash: string;
  provider: string;
  userId: number;
};

function requireOAuthUserRow(user: UserRow | null) {
  if (!user) throw new Error("OAUTH_USER_CREATE_FAILED");
  return user;
}

async function createOrLinkOAuthUser({
  email,
  emailVerified,
  nickname,
  provider,
  providerUserId,
}: CreateOrLinkOAuthUserParams) {
  return withTransaction(async (tx) => {
    const linkedUser = await tx.queryFirst<UserRow>(SELECT_AUTH_IDENTITY_BY_PROVIDER_USER, [provider, providerUserId]);
    if (linkedUser) return linkedUser;

    let user = await tx.queryFirst<UserRow>(SELECT_USER_BY_EMAIL, [email]);
    if (!user) {
      const result = await tx.queryResult(INSERT_USER_OAUTH, [email, nickname ?? null, emailVerified ? 1 : 0]);
      user = await tx.queryFirst<UserRow>(SELECT_USER_BY_ID, [result.insertId]);
    }

    const resolvedUser = requireOAuthUserRow(user);
    await tx.queryResult(INSERT_AUTH_IDENTITY, [
      resolvedUser.ID,
      provider,
      providerUserId,
      email,
      emailVerified ? 1 : 0,
    ]);
    return resolvedUser;
  });
}

async function createOAuthRequest({
  provider,
  stateHash,
  nonceHash,
  redirectUri,
  redirectPath,
  mobileReturnUri,
}: CreateOAuthRequestParams) {
  await queryResult(INSERT_OAUTH_REQUEST, [
    provider,
    stateHash,
    nonceHash,
    redirectUri,
    redirectPath,
    mobileReturnUri ?? null,
  ]);
}

async function consumeOAuthRequest(stateHash: string) {
  const result = await queryResult(CONSUME_OAUTH_REQUEST, [stateHash]);
  if (!result.affectedRows) return null;

  return queryFirst<OAuthRequestRow>(SELECT_OAUTH_REQUEST_BY_STATE_HASH, [stateHash]);
}

async function createMobileOAuthCode({ userId, provider, codeHash }: CreateMobileOAuthCodeParams) {
  await queryResult(INSERT_MOBILE_OAUTH_CODE, [userId, provider, codeHash]);
}

async function consumeMobileOAuthCode(codeHash: string) {
  const result = await queryResult(CONSUME_MOBILE_OAUTH_CODE, [codeHash]);
  if (!result.affectedRows) return null;

  return queryFirst<UserRow>(SELECT_MOBILE_OAUTH_CODE_BY_CODE_HASH, [codeHash]);
}

export {
  consumeMobileOAuthCode,
  consumeOAuthRequest,
  createMobileOAuthCode,
  createOAuthRequest,
  createOrLinkOAuthUser,
};
