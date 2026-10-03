import { requireBodyPassword, requireBodyString, requireCurrentUser } from "./guards";
import {
  changeProfilePassword,
  updateProfileNickname,
  withdrawProfile,
} from "../services/profileService";
import { API_MESSAGES } from "../utils/messages";
import type { ApiRequest, ApiResponse } from "../types/api";

async function getMe(req: ApiRequest, res: ApiResponse) {
  const user = await requireCurrentUser(req, res);
  if (!user) return;

  return res.json({ ...API_MESSAGES.OK, user });
}

async function updateNickname(req: ApiRequest, res: ApiResponse) {
  const user = await requireCurrentUser(req, res);
  if (!user) return;

  const nickname = requireBodyString(req, res, "nickname", API_MESSAGES.NICKNAME_REQUIRED);
  if (!nickname) return;

  const updated = await updateProfileNickname(user.ID, nickname);
  return res.json({ ...API_MESSAGES.OK, user: updated });
}

async function changePassword(req: ApiRequest, res: ApiResponse) {
  const user = await requireCurrentUser(req, res);
  if (!user) return;

  const currentPassword = requireBodyString(req, res, "currentPassword", API_MESSAGES.CURRENT_PASSWORD_REQUIRED, {
    trim: false,
  });
  if (!currentPassword) return;

  const newPassword = requireBodyPassword(req, res, "newPassword", API_MESSAGES.NEW_PASSWORD_REQUIRED);
  if (!newPassword) return;

  const result = await changeProfilePassword({ userId: user.ID, currentPassword, newPassword });
  if (result === "not_found") return res.status(401).json(API_MESSAGES.USER_NOT_FOUND);
  if (result === "invalid_current_password") return res.status(401).json(API_MESSAGES.INVALID_CREDENTIALS);
  if (result === "password_login_not_available") {
    return res.status(409).json(API_MESSAGES.PASSWORD_LOGIN_NOT_AVAILABLE);
  }

  return res.json({ ...API_MESSAGES.OK });
}

async function withdraw(req: ApiRequest, res: ApiResponse) {
  const user = await requireCurrentUser(req, res);
  if (!user) return;

  await withdrawProfile(user.ID);

  return res.json({ ...API_MESSAGES.OK });
}

export { changePassword, getMe, updateNickname, withdraw };
