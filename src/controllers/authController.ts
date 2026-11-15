import {
  requireBodyEmail,
  requireBodyPassword,
  requireBodyString,
} from "./guards";
import { serializeAuthSession } from "../utils/authSession";
import { API_MESSAGES } from "../utils/messages";
import { isRateLimited, rateLimitKey } from "../utils/rateLimit";
import {
  checkEmailRegistration,
  confirmEmailVerification,
  confirmPasswordResetWithCode,
  loginLocalUser,
  registerLocalUser,
  requestPasswordResetCode,
} from "../services/authService";
import type { RequestContext } from "../types/api";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function rejectWhenRateLimited(req: RequestContext, scope: string, identifier: string, limit: number) {
  if (!isRateLimited({ key: rateLimitKey(req, scope, identifier), limit, windowMs: RATE_LIMIT_WINDOW_MS })) return;

  throw Response.json(API_MESSAGES.RATE_LIMITED, { status: 429 });
}

async function checkEmail(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:check-email", email, 30);

  return Response.json(await checkEmailRegistration(email));
}

async function register(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:register", email, 5);

  const password = requireBodyPassword(req, "password", API_MESSAGES.PASSWORD_REQUIRED);

  const nickname = requireBodyString(req, "nickname", API_MESSAGES.NICKNAME_REQUIRED);

  const result = await registerLocalUser({ email, password, nickname });
  if (result.status === "email_exists") return Response.json(API_MESSAGES.EMAIL_ALREADY_EXISTS, { status: 409 });

  return Response.json({
    ...API_MESSAGES.OK,
    verificationRequired: true,
    email: result.email,
    ...(result.verificationCode ? { verificationCode: result.verificationCode } : {}),
  }, { status: 201 });
}

async function confirmEmail(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:confirm-email", email, 10);

  const code = requireBodyString(req, "code", API_MESSAGES.EMAIL_VERIFICATION_CODE_REQUIRED);

  const user = await confirmEmailVerification(email, code);
  if (!user) return Response.json(API_MESSAGES.INVALID_EMAIL_VERIFICATION_CODE, { status: 400 });

  return Response.json({ ...API_MESSAGES.OK, ...serializeAuthSession(user) });
}

async function login(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:login", email, 10);

  const password = requireBodyString(req, "password", API_MESSAGES.PASSWORD_REQUIRED, { trim: false });

  const result = await loginLocalUser(email, password);
  if (result.status === "invalid_credentials") return Response.json(API_MESSAGES.INVALID_CREDENTIALS, { status: 401 });
  if (result.status === "email_not_verified") return Response.json(API_MESSAGES.EMAIL_NOT_VERIFIED, { status: 403 });

  return Response.json({ ...API_MESSAGES.OK, ...serializeAuthSession(result.user) });
}

async function requestPasswordReset(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:password-reset-request", email, 5);

  const result = await requestPasswordResetCode(email);

  return Response.json({
    ...API_MESSAGES.OK,
    ...result,
  });
}

async function confirmPasswordReset(req: RequestContext) {
  const email = requireBodyEmail(req, "email", API_MESSAGES.EMAIL_REQUIRED);
  rejectWhenRateLimited(req, "auth:password-reset-confirm", email, 10);

  const code = requireBodyString(req, "code", API_MESSAGES.RESET_CODE_REQUIRED);

  const newPassword = requireBodyPassword(req, "newPassword", API_MESSAGES.NEW_PASSWORD_REQUIRED);

  const confirmed = await confirmPasswordResetWithCode({ email, code, newPassword });
  if (!confirmed) return Response.json(API_MESSAGES.INVALID_RESET_CODE, { status: 400 });

  return Response.json({ ...API_MESSAGES.OK });
}

export { checkEmail, confirmEmail, login, register, requestPasswordReset, confirmPasswordReset };
