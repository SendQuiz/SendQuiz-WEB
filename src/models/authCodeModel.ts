import { queryFirst, queryResult, withTransaction } from "../utils/db";
import { hashSecret, verifySecret } from "../utils/secrets";
import { loadQuery } from "../utils/sql";
import type { UserRow } from "./userModel";
import type { RowDataPacket } from "mysql2";

const SELECT_USER_BY_ID = loadQuery("USERS_SELECT_BY_ID.sql");
const SELECT_USER_BY_EMAIL = loadQuery("USERS_SELECT_BY_EMAIL.sql");
const UPDATE_USER_PASSWORD_BY_ID = loadQuery("USERS_UPDATE_PASSWORD_BY_ID.sql");
const INCREMENT_USER_TOKEN_VERSION_BY_ID = loadQuery("USERS_INCREMENT_TOKEN_VERSION_BY_ID.sql");
const INSERT_PASSWORD_RESET_CODE = loadQuery("PASSWORD_RESET_CODES_INSERT.sql");
const SELECT_LATEST_ACTIVE_PASSWORD_RESET_CODE_BY_EMAIL = loadQuery("PASSWORD_RESET_CODES_SELECT_LATEST_ACTIVE_BY_EMAIL.sql");
const MARK_PASSWORD_RESET_CODE_USED = loadQuery("PASSWORD_RESET_CODES_MARK_USED.sql");
const SELECT_LATEST_ACTIVE_EMAIL_VERIFICATION_CODE_BY_EMAIL = loadQuery("EMAIL_VERIFICATION_CODES_SELECT_LATEST_ACTIVE_BY_EMAIL.sql");
const MARK_EMAIL_VERIFICATION_CODE_USED = loadQuery("EMAIL_VERIFICATION_CODES_MARK_USED.sql");
const VERIFY_USER_EMAIL_BY_ID = loadQuery("USERS_VERIFY_EMAIL_BY_ID.sql");

type UserIdParams = {
  userId: number;
};

type VerificationCodeRow = RowDataPacket & {
  CODE_HASH: string;
  ID: number;
  USER_ID: number;
};

type CodeHashParams = UserIdParams & {
  codeHash: string;
};

type EmailCodeHashParams = {
  codeHash: string;
  email: string;
};

type ConfirmPasswordResetParams = UserIdParams & {
  newPassword: string;
  resetCodeId: number;
};

type VerifyUserEmailParams = UserIdParams & {
  verificationCodeId: number;
};

function requireUserRow(user: UserRow | null) {
  if (!user) throw new Error("USER_EMAIL_VERIFY_FAILED");
  return user;
}

async function findMatchingCode(readCode: () => Promise<VerificationCodeRow | null>, code: string) {
  const verificationCode = await readCode();
  if (!verificationCode) return null;

  const codeMatches = await verifySecret(code, verificationCode.CODE_HASH);
  return codeMatches ? verificationCode : null;
}

async function createPasswordResetCode({ userId, codeHash }: CodeHashParams) {
  await queryResult(INSERT_PASSWORD_RESET_CODE, [userId, codeHash]);
}

async function createPasswordResetCodeByEmail({ email, codeHash }: EmailCodeHashParams) {
  const user = await queryFirst<UserRow>(SELECT_USER_BY_EMAIL, [email]);
  if (!user) return false;

  await createPasswordResetCode({ userId: user.ID, codeHash });
  return true;
}

async function getLatestActivePasswordResetCodeByEmail(email: string) {
  return queryFirst<VerificationCodeRow>(SELECT_LATEST_ACTIVE_PASSWORD_RESET_CODE_BY_EMAIL, [email]);
}

async function getMatchingPasswordResetCodeByEmail(email: string, code: string) {
  return findMatchingCode(() => getLatestActivePasswordResetCodeByEmail(email), code);
}

async function confirmPasswordResetCode({ userId, newPassword, resetCodeId }: ConfirmPasswordResetParams) {
  const passwordHash = await hashSecret(newPassword);

  await withTransaction(async (tx) => {
    await tx.queryResult(UPDATE_USER_PASSWORD_BY_ID, [passwordHash, userId]);
    await tx.queryResult(INCREMENT_USER_TOKEN_VERSION_BY_ID, [userId]);
    await tx.queryResult(MARK_PASSWORD_RESET_CODE_USED, [resetCodeId]);
  });
}

async function getLatestActiveEmailVerificationCodeByEmail(email: string) {
  return queryFirst<VerificationCodeRow>(SELECT_LATEST_ACTIVE_EMAIL_VERIFICATION_CODE_BY_EMAIL, [email]);
}

async function getMatchingEmailVerificationCodeByEmail(email: string, code: string) {
  return findMatchingCode(() => getLatestActiveEmailVerificationCodeByEmail(email), code);
}

async function verifyUserEmailWithCode({ userId, verificationCodeId }: VerifyUserEmailParams) {
  return withTransaction(async (tx) => {
    await tx.queryResult(MARK_EMAIL_VERIFICATION_CODE_USED, [verificationCodeId]);
    await tx.queryResult(VERIFY_USER_EMAIL_BY_ID, [userId]);

    const user = await tx.queryFirst<UserRow>(SELECT_USER_BY_ID, [userId]);
    return requireUserRow(user);
  });
}

export {
  confirmPasswordResetCode,
  createPasswordResetCodeByEmail,
  getMatchingEmailVerificationCodeByEmail,
  getMatchingPasswordResetCodeByEmail,
  verifyUserEmailWithCode,
};
