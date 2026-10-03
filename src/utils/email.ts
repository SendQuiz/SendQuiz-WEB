import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

import { createHttpError } from "./httpError";

type EmailMessage = {
  subject: string;
  text: string;
  to: string;
};

type CodeEmail = {
  code: string;
  to: string;
};

function readSender() {
  return process.env.SES_FROM_EMAIL || process.env.AWS_SES_FROM_EMAIL || process.env.AUTH_EMAIL_FROM || "";
}

function readRegion() {
  return process.env.AWS_REGION || process.env.AWS_SES_REGION || process.env.SES_REGION || "";
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function createSesClient() {
  const region = readRegion();
  if (!region) {
    throw createHttpError("SES_REGION_MISSING", 500);
  }
  return new SESClient({ region });
}

async function sendEmail({ to, subject, text }: EmailMessage) {
  const from = readSender();
  if (!from) {
    throw createHttpError("SES_FROM_EMAIL_MISSING", 500);
  }

  await createSesClient().send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Charset: "UTF-8", Data: subject },
        Body: {
          Text: { Charset: "UTF-8", Data: text },
        },
      },
    })
  );
}

async function sendPasswordResetCodeEmail({ to, code }: CodeEmail) {
  await sendEmail({
    to,
    subject: "[SEND] 비밀번호 재설정 인증 코드",
    text: `SEND 비밀번호 재설정 인증 코드는 ${code} 입니다. 10분 안에 입력해 주세요.`,
  });
}

async function sendEmailVerificationCodeEmail({ to, code }: CodeEmail) {
  await sendEmail({
    to,
    subject: "[SEND] 이메일 인증 코드",
    text: `SEND 이메일 인증 코드는 ${code} 입니다. 10분 안에 입력해 주세요.`,
  });
}

async function sendCodeEmailOrDevFallback(send: (message: CodeEmail) => Promise<void>, message: CodeEmail) {
  try {
    await send(message);
    return { sent: true };
  } catch (error) {
    if (isProduction()) throw error;
    return { sent: false, error };
  }
}

async function sendPasswordResetCodeEmailOrDevFallback(message: CodeEmail) {
  return sendCodeEmailOrDevFallback(sendPasswordResetCodeEmail, message);
}

async function sendEmailVerificationCodeEmailOrDevFallback(message: CodeEmail) {
  return sendCodeEmailOrDevFallback(sendEmailVerificationCodeEmail, message);
}

export {
  sendEmailVerificationCodeEmail,
  sendEmailVerificationCodeEmailOrDevFallback,
  sendPasswordResetCodeEmail,
  sendPasswordResetCodeEmailOrDevFallback,
};
