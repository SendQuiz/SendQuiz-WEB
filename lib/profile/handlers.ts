import { requireBodyPassword, requireBodyString, requireCurrentUser } from "@/lib/http/guards";
import {
  changeProfilePassword,
  updateProfileNickname,
  withdrawProfile,
} from "@/lib/profile/service";
import { API_MESSAGES } from "@/lib/http/messages";
import type { RequestContext } from "@/lib/http/types";

async function getMe(req: RequestContext) {
  const user = await requireCurrentUser(req);

  return Response.json({ ...API_MESSAGES.OK, user });
}

async function updateNickname(req: RequestContext) {
  const user = await requireCurrentUser(req);

  const nickname = requireBodyString(req, "nickname", API_MESSAGES.NICKNAME_REQUIRED);

  const updated = await updateProfileNickname(user.ID, nickname);
  return Response.json({ ...API_MESSAGES.OK, user: updated });
}

async function changePassword(req: RequestContext) {
  const user = await requireCurrentUser(req);

  const currentPassword = requireBodyString(req, "currentPassword", API_MESSAGES.CURRENT_PASSWORD_REQUIRED, {
    trim: false,
  });

  const newPassword = requireBodyPassword(req, "newPassword", API_MESSAGES.NEW_PASSWORD_REQUIRED);

  const result = await changeProfilePassword({ userId: user.ID, currentPassword, newPassword });
  if (result === "not_found") return Response.json(API_MESSAGES.USER_NOT_FOUND, { status: 401 });
  if (result === "invalid_current_password") return Response.json(API_MESSAGES.INVALID_CREDENTIALS, { status: 401 });
  if (result === "password_login_not_available") {
    return Response.json(API_MESSAGES.PASSWORD_LOGIN_NOT_AVAILABLE, { status: 409 });
  }

  return Response.json({ ...API_MESSAGES.OK });
}

async function withdraw(req: RequestContext) {
  const user = await requireCurrentUser(req);

  await withdrawProfile(user.ID);

  return Response.json({ ...API_MESSAGES.OK });
}

export { changePassword, getMe, updateNickname, withdraw };
