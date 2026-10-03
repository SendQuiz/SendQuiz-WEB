import { signAuthToken } from "./auth";

type SerializableAuthUser = {
  CREATED_AT?: unknown;
  EMAIL: string;
  ID: number;
  NICKNAME?: string | null;
  TOKEN_VERSION?: number | string | null;
  UPDATED_AT?: unknown;
};

function serializeAuthSession(user: SerializableAuthUser) {
  const publicUser = {
    ID: user.ID,
    EMAIL: user.EMAIL,
    NICKNAME: user.NICKNAME ?? null,
    CREATED_AT: user.CREATED_AT,
    UPDATED_AT: user.UPDATED_AT,
  };

  return {
    token: signAuthToken(user),
    user: publicUser,
  };
}

export { serializeAuthSession };
