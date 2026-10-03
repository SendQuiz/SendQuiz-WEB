import { queryFirst, withTransaction } from "../utils/db";
import { loadQuery } from "../utils/sql";
import { hashSecret, verifySecret } from "../utils/secrets";
import type { RowDataPacket } from "mysql2";

const INSERT_USER_LOCAL = loadQuery("USERS_INSERT_LOCAL.sql");
const SELECT_USER_BY_ID = loadQuery("USERS_SELECT_BY_ID.sql");
const SELECT_USER_BY_EMAIL = loadQuery("USERS_SELECT_BY_EMAIL.sql");
const SELECT_USER_AUTH_BY_ID = loadQuery("USERS_SELECT_AUTH_BY_ID.sql");
const SELECT_USER_AUTH_BY_EMAIL = loadQuery("USERS_SELECT_AUTH_BY_EMAIL.sql");
const UPDATE_USER_NICKNAME_BY_ID = loadQuery("USERS_UPDATE_NICKNAME_BY_ID.sql");
const UPDATE_USER_PASSWORD_BY_ID = loadQuery("USERS_UPDATE_PASSWORD_BY_ID.sql");
const INCREMENT_USER_TOKEN_VERSION_BY_ID = loadQuery("USERS_INCREMENT_TOKEN_VERSION_BY_ID.sql");
const DELETE_USER_BY_ID = loadQuery("USERS_DELETE_BY_ID.sql");
const INSERT_EMAIL_VERIFICATION_CODE = loadQuery("EMAIL_VERIFICATION_CODES_INSERT.sql");
const DELETE_AUTH_IDENTITIES_BY_USER_ID = loadQuery("AUTH_IDENTITIES_DELETE_BY_USER_ID.sql");
const DELETE_AUTH_MOBILE_OAUTH_CODES_BY_USER_ID = loadQuery("AUTH_MOBILE_OAUTH_CODES_DELETE_BY_USER_ID.sql");
const DELETE_EMAIL_VERIFICATION_CODES_BY_USER_ID = loadQuery("EMAIL_VERIFICATION_CODES_DELETE_BY_USER_ID.sql");
const DELETE_PASSWORD_RESET_CODES_BY_USER_ID = loadQuery("PASSWORD_RESET_CODES_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_CHAT_LOG_SETS_BY_USER_ID = loadQuery("QUIZ_CHAT_LOG_SETS_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_CHAT_PROGRESS_BY_USER_ID = loadQuery("QUIZ_CHAT_PROGRESS_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_CHATS_BY_USER_ID = loadQuery("QUIZ_CHATS_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_ITEMS_BY_USER_ID = loadQuery("QUIZ_ITEMS_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_ITEM_ATTEMPTS_BY_USER_ID = loadQuery("QUIZ_ITEM_ATTEMPTS_DELETE_BY_USER_ID.sql");
const DELETE_QUIZ_WRONG_ITEMS_BY_USER_ID = loadQuery("QUIZ_WRONG_ITEMS_DELETE_BY_USER_ID.sql");

type UserIdParams = {
  userId: number;
};

type UserRow = RowDataPacket & {
  CREATED_AT?: unknown;
  EMAIL: string;
  EMAIL_VERIFIED_AT?: unknown;
  HAS_PASSWORD_LOGIN?: number;
  ID: number;
  NICKNAME?: string | null;
  PASSWORD_HASH?: string | null;
  TOKEN_VERSION?: number;
  UPDATED_AT?: unknown;
};

type CreateLocalUserParams = {
  email: string;
  nickname: string | null;
  password: string;
};

type CreateLocalUserWithEmailVerificationParams = CreateLocalUserParams & {
  codeHash: string;
};

type UpdateNicknameParams = UserIdParams & {
  nickname: string | null;
};

type ChangePasswordParams = UserIdParams & {
  currentPassword: string;
  newPassword: string;
};

type AuthenticateLocalUserResult =
  | { status: "authenticated"; user: UserRow }
  | { status: "email_not_verified" }
  | { status: "invalid_credentials" };

type EmailRegistrationStatus =
  | { confirmed: boolean; status: "exists" }
  | { status: "not_found" };

function requireUserRow(user: UserRow | null, message: string) {
  if (!user) throw new Error(message);
  return user;
}

async function createLocalUserWithEmailVerification({
  email,
  password,
  nickname,
  codeHash,
}: CreateLocalUserWithEmailVerificationParams) {
  const passwordHash = await hashSecret(password);

  return withTransaction(async (tx) => {
    const result = await tx.queryResult(INSERT_USER_LOCAL, [email, passwordHash, nickname ?? null]);
    const user = await tx.queryFirst<UserRow>(SELECT_USER_BY_ID, [result.insertId]);

    await tx.queryResult(INSERT_EMAIL_VERIFICATION_CODE, [result.insertId, codeHash]);
    return requireUserRow(user, "LOCAL_USER_CREATE_FAILED");
  });
}

async function getUserById(userId: number) {
  return queryFirst<UserRow>(SELECT_USER_BY_ID, [userId]);
}

async function getUserByEmail(email: string) {
  return queryFirst<UserRow>(SELECT_USER_BY_EMAIL, [email]);
}

async function getEmailRegistrationStatus(email: string): Promise<EmailRegistrationStatus> {
  const user = await getUserByEmail(email);
  if (!user) return { status: "not_found" };

  return { status: "exists", confirmed: Boolean(user.EMAIL_VERIFIED_AT) };
}

async function getUserAuthByEmail(email: string) {
  return queryFirst<UserRow>(SELECT_USER_AUTH_BY_EMAIL, [email]);
}

async function authenticateLocalUser(email: string, password: string): Promise<AuthenticateLocalUserResult> {
  const user = await getUserAuthByEmail(email);
  if (!user?.PASSWORD_HASH) return { status: "invalid_credentials" };
  if (!user.EMAIL_VERIFIED_AT) return { status: "email_not_verified" };

  const passwordMatches = await verifySecret(password, user.PASSWORD_HASH);
  if (!passwordMatches) return { status: "invalid_credentials" };

  return { status: "authenticated", user };
}

async function getUserAuthById(userId: number) {
  return queryFirst<UserRow>(SELECT_USER_AUTH_BY_ID, [userId]);
}

async function updateUserNicknameById({ userId, nickname }: UpdateNicknameParams) {
  return withTransaction(async (tx) => {
    await tx.queryResult(UPDATE_USER_NICKNAME_BY_ID, [nickname ?? null, userId]);

    const user = await tx.queryFirst<UserRow>(SELECT_USER_BY_ID, [userId]);
    return requireUserRow(user, "USER_NICKNAME_UPDATE_FAILED");
  });
}

async function changeUserPasswordById({ userId, currentPassword, newPassword }: ChangePasswordParams) {
  const user = await getUserAuthById(userId);
  if (!user) return "not_found";
  if (!user.PASSWORD_HASH) return "password_login_not_available";

  const passwordMatches = await verifySecret(currentPassword, user.PASSWORD_HASH);
  if (!passwordMatches) return "invalid_current_password";

  const passwordHash = await hashSecret(newPassword);
  await withTransaction(async (tx) => {
    await tx.queryResult(UPDATE_USER_PASSWORD_BY_ID, [passwordHash, userId]);
    await tx.queryResult(INCREMENT_USER_TOKEN_VERSION_BY_ID, [userId]);
  });
  return "updated";
}

async function deleteUserById(userId: number) {
  await withTransaction(async (tx) => {
    await tx.queryResult(DELETE_AUTH_MOBILE_OAUTH_CODES_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_AUTH_IDENTITIES_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_EMAIL_VERIFICATION_CODES_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_PASSWORD_RESET_CODES_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_ITEM_ATTEMPTS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_WRONG_ITEMS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_CHAT_LOG_SETS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_CHAT_PROGRESS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_ITEMS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_QUIZ_CHATS_BY_USER_ID, [userId]);
    await tx.queryResult(DELETE_USER_BY_ID, [userId]);
  });
}

export {
  authenticateLocalUser,
  changeUserPasswordById,
  createLocalUserWithEmailVerification,
  deleteUserById,
  getEmailRegistrationStatus,
  getUserAuthById,
  getUserByEmail,
  getUserById,
  updateUserNicknameById,
};
export type { UserRow };
