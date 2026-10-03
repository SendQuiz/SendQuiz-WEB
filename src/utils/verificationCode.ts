import { randomInt } from "node:crypto";

import { hashSecret } from "./secrets";

const SIX_DIGIT_CODE_UPPER_BOUND = 1_000_000;

function createSixDigitVerificationCode() {
  return randomInt(SIX_DIGIT_CODE_UPPER_BOUND).toString().padStart(6, "0");
}

async function createHashedVerificationCode() {
  const code = createSixDigitVerificationCode();
  const codeHash = await hashSecret(code);
  return { code, codeHash };
}

export { createHashedVerificationCode };
