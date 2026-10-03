import { parseJson } from "./json";

type QuizLogMessage = {
  isMine: boolean;
  itemId: number | null;
  questionNo: number | null;
  text: string;
  time: string;
};

type QuizStats = {
  correctAttempts: number;
  todaySolved: number;
  totalAttempts: number;
  totalQuestions: number;
};

function toPositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isAnswerCorrect(userAnswer: unknown, correctAnswer: unknown) {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}

function normalizeQuizLogMessages(value: unknown): QuizLogMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const text = String(row.text ?? "").trim();
      const time = String(row.time ?? "").trim();
      const isMine = Boolean(row.isMine);
      return {
        text,
        time,
        isMine,
        itemId: toPositiveNumber(row.itemId),
        questionNo: toPositiveNumber(row.questionNo),
      };
    })
    .filter((row) => row.text && row.time)
    .slice(0, 500);
}

function serializeQuizLogSet(row: Record<string, unknown>) {
  return {
    id: Number(row.ID),
    mode: String(row.MODE),
    messages: normalizeQuizLogMessages(parseJson(String(row.MESSAGES_JSON || "[]"))),
    createdAt: row.CREATED_AT ? String(row.CREATED_AT) : null,
    updatedAt: row.UPDATED_AT ? String(row.UPDATED_AT) : null,
  };
}

function serializeChatProgress(row: Record<string, unknown> | null) {
  return {
    lastItemId: toPositiveNumber(row?.LAST_ITEM_ID),
    lastQuestionNo: toPositiveNumber(row?.LAST_QUESTION_NO),
    updatedAt: row?.UPDATED_AT ? String(row.UPDATED_AT) : null,
  };
}

function serializeQuizStats({ totalQuestions, totalAttempts, correctAttempts, todaySolved }: QuizStats) {
  const correctRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return {
    TOTAL_QUESTIONS: totalQuestions,
    CORRECT_RATE: Number.isFinite(correctRate) ? correctRate : 0,
    TODAY_SOLVED: todaySolved,
  };
}

export {
  isAnswerCorrect,
  normalizeQuizLogMessages,
  serializeChatProgress,
  serializeQuizLogSet,
  serializeQuizStats,
  toPositiveNumber,
};
