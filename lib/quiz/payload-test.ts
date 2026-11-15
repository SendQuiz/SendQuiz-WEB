import { describe, expect, it } from "vitest";

import { isAnswerCorrect, normalizeQuizLogMessages, serializeQuizLogSet, serializeQuizStats } from "@/lib/quiz/payload";

describe("quiz payloads", () => {
  it("ignores casing and repeated whitespace when checking answers", () => {
    expect(isAnswerCorrect("  Hello\n WORLD ", "hello world")).toBe(true);
    expect(isAnswerCorrect("hello", "hello world")).toBe(false);
  });

  it("discards invalid messages and normalizes message identifiers", () => {
    expect(normalizeQuizLogMessages([
      null,
      { text: " ", time: "12:00" },
      { text: "hello" },
      { text: " hello ", time: " 12:00 ", isMine: true, itemId: "3", questionNo: -1 },
    ])).toEqual([
      { text: "hello", time: "12:00", isMine: true, itemId: 3, questionNo: null },
    ]);
  });

  it("limits stored chat messages to 500 entries", () => {
    expect(normalizeQuizLogMessages(Array.from({ length: 501 }, () => ({ text: "hello", time: "12:00" })))).toHaveLength(500);
  });

  it("handles malformed stored message JSON", () => {
    expect(serializeQuizLogSet({ ID: 1, MODE: "chat", MESSAGES_JSON: "invalid" }).messages).toEqual([]);
  });

  it("calculates rounded accuracy and handles zero attempts", () => {
    expect(serializeQuizStats({ totalQuestions: 10, totalAttempts: 3, correctAttempts: 2, todaySolved: 1 }))
      .toEqual({ TOTAL_QUESTIONS: 10, CORRECT_RATE: 67, TODAY_SOLVED: 1 });
    expect(serializeQuizStats({ totalQuestions: 10, totalAttempts: 0, correctAttempts: 0, todaySolved: 0 }).CORRECT_RATE)
      .toBe(0);
  });
});
