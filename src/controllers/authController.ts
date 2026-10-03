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
import type { ApiRequest, ApiResponse } from "../types/api";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function rejectWhenRateLimited(req: ApiRequest, res: ApiResponse, scope: string, identifier: string, limit: number) {
  if (!isRateLimited({ key: rateLimitKey(req, scope, identifier), limit, windowMs: RATE_LIMIT_WINDOW_MS })) return false;

  res.status(429).json(API_MESSAGES.RATE_LIMITED);
  return true;
}

async function checkEmail(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:check-email", email, 30)) return;

  return res.json(await checkEmailRegistration(email));
}

async function register(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:register", email, 5)) return;

  const password = requireBodyPassword(req, res, "password", API_MESSAGES.PASSWORD_REQUIRED);
  if (!password) return;

  const nickname = requireBodyString(req, res, "nickname", API_MESSAGES.NICKNAME_REQUIRED);
  if (!nickname) return;

  const result = await registerLocalUser({ email, password, nickname });
  if (result.status === "email_exists") return res.status(409).json(API_MESSAGES.EMAIL_ALREADY_EXISTS);

  return res.status(201).json({
    ...API_MESSAGES.OK,
    verificationRequired: true,
    email: result.email,
    ...(result.verificationCode ? { verificationCode: result.verificationCode } : {}),
  });
}

async function confirmEmail(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:confirm-email", email, 10)) return;

  const code = requireBodyString(req, res, "code", API_MESSAGES.EMAIL_VERIFICATION_CODE_REQUIRED);
  if (!code) return;

  const user = await confirmEmailVerification(email, code);
  if (!user) return res.status(400).json(API_MESSAGES.INVALID_EMAIL_VERIFICATION_CODE);

  return res.json({ ...API_MESSAGES.OK, ...serializeAuthSession(user) });
}

async function login(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:login", email, 10)) return;

  const password = requireBodyString(req, res, "password", API_MESSAGES.PASSWORD_REQUIRED, { trim: false });
  if (!password) return;

  const result = await loginLocalUser(email, password);
  if (result.status === "invalid_credentials") return res.status(401).json(API_MESSAGES.INVALID_CREDENTIALS);
  if (result.status === "email_not_verified") return res.status(403).json(API_MESSAGES.EMAIL_NOT_VERIFIED);

  return res.json({ ...API_MESSAGES.OK, ...serializeAuthSession(result.user) });
}

async function requestPasswordReset(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:password-reset-request", email, 5)) return;

  const result = await requestPasswordResetCode(email);

  return res.json({
    ...API_MESSAGES.OK,
    ...result,
  });
}

async function confirmPasswordReset(req: ApiRequest, res: ApiResponse) {
  const email = requireBodyEmail(req, res, "email", API_MESSAGES.EMAIL_REQUIRED);
  if (!email) return;
  if (rejectWhenRateLimited(req, res, "auth:password-reset-confirm", email, 10)) return;

  const code = requireBodyString(req, res, "code", API_MESSAGES.RESET_CODE_REQUIRED);
  if (!code) return;

  const newPassword = requireBodyPassword(req, res, "newPassword", API_MESSAGES.NEW_PASSWORD_REQUIRED);
  if (!newPassword) return;

  const confirmed = await confirmPasswordResetWithCode({ email, code, newPassword });
  if (!confirmed) return res.status(400).json(API_MESSAGES.INVALID_RESET_CODE);

  return res.json({ ...API_MESSAGES.OK });
}

export { checkEmail, confirmEmail, login, register, requestPasswordReset, confirmPasswordReset };
