import bcrypt from "bcryptjs";

const PASSWORD_MIN_LENGTH = 8;
const SECRET_SALT_ROUNDS = 12;

function hasMinimumPasswordLength(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH;
}

function hashSecret(secret: string) {
  return bcrypt.hash(secret, SECRET_SALT_ROUNDS);
}

function verifySecret(secret: string, hash: string) {
  return bcrypt.compare(secret, hash);
}

export { hasMinimumPasswordLength, hashSecret, verifySecret };
