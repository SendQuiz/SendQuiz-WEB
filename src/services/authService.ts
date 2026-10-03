import {
  confirmPasswordResetCode,
  createPasswordResetCodeByEmail,
  getMatchingEmailVerificationCodeByEmail,
  getMatchingPasswordResetCodeByEmail,
  verifyUserEmailWithCode,
} from "../models/authCodeModel";
import {
  authenticateLocalUser,
  createLocalUserWithEmailVerification,
  getEmailRegistrationStatus,
} from "../models/userModel";
import {
  sendEmailVerificationCodeEmailOrDevFallback,
  sendPasswordResetCodeEmailOrDevFallback,
} from "../utils/email";
import { createHashedVerificationCode } from "../utils/verificationCode";

type RegisterLocalUserParams = {
  email: string;
  nickname: string;
  password: string;
};

type RegisterLocalUserResult =
  | { status: "created"; email: string; verificationCode?: string }
  | { status: "email_exists" };

async function checkEmailRegistration(email: string) {
  return getEmailRegistrationStatus(email);
}

async function loginLocalUser(email: string, password: string) {
  return authenticateLocalUser(email, password);
}

async function registerLocalUser({
  email,
  password,
  nickname,
}: RegisterLocalUserParams): Promise<RegisterLocalUserResult> {
  const emailStatus = await checkEmailRegistration(email);
  if (emailStatus.status === "exists") return { status: "email_exists" };

  const { code, codeHash } = await createHashedVerificationCode();
  await createLocalUserWithEmailVerification({ email, password, nickname, codeHash });
  const emailResult = await sendEmailVerificationCodeEmailOrDevFallback({ to: email, code });

  return {
    status: "created",
    email,
    ...(process.env.NODE_ENV !== "production" && !emailResult.sent ? { verificationCode: code } : {}),
  };
}

async function requestPasswordResetCode(email: string) {
  const { code, codeHash } = await createHashedVerificationCode();
  const created = await createPasswordResetCodeByEmail({ email, codeHash });
  if (!created) return {};

  const emailResult = await sendPasswordResetCodeEmailOrDevFallback({ to: email, code });
  return {
    ...(process.env.NODE_ENV !== "production" && !emailResult.sent ? { resetCode: code } : {}),
  };
}

async function confirmEmailVerification(email: string, code: string) {
  const verificationCode = await getMatchingEmailVerificationCodeByEmail(email, code);
  if (!verificationCode) return null;

  return verifyUserEmailWithCode({
    userId: verificationCode.USER_ID,
    verificationCodeId: verificationCode.ID,
  });
}

async function confirmPasswordResetWithCode({
  email,
  code,
  newPassword,
}: {
  code: string;
  email: string;
  newPassword: string;
}) {
  const resetCode = await getMatchingPasswordResetCodeByEmail(email, code);
  if (!resetCode) return false;

  await confirmPasswordResetCode({
    userId: resetCode.USER_ID,
    newPassword,
    resetCodeId: resetCode.ID,
  });
  return true;
}

export {
  checkEmailRegistration,
  confirmEmailVerification,
  confirmPasswordResetWithCode,
  loginLocalUser,
  registerLocalUser,
  requestPasswordResetCode,
};
