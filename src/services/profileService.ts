import {
  changeUserPasswordById,
  deleteUserById,
  updateUserNicknameById,
} from "../models/userModel";

function updateProfileNickname(userId: number, nickname: string) {
  return updateUserNicknameById({ userId, nickname });
}

function changeProfilePassword({
  userId,
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
  userId: number;
}) {
  return changeUserPasswordById({ userId, currentPassword, newPassword });
}

async function withdrawProfile(userId: number) {
  await deleteUserById(userId);
}

export { changeProfilePassword, updateProfileNickname, withdrawProfile };
