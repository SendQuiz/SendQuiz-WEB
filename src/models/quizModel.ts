import { queryFirst, queryResult, queryRows, withTransaction } from "../utils/db";
import { loadQuery } from "../utils/sql";
import type { RowDataPacket } from "mysql2";

const QUIZ_CHATS_SELECT_BY_USER_ID = loadQuery("QUIZ_CHATS_SELECT_BY_USER_ID.sql");
const QUIZ_CHATS_INSERT = loadQuery("QUIZ_CHATS_INSERT.sql");
const QUIZ_CHATS_SELECT_BY_ID_AND_USER_ID = loadQuery("QUIZ_CHATS_SELECT_BY_ID_AND_USER_ID.sql");
const QUIZ_CHATS_TOUCH_UPDATED_AT = loadQuery("QUIZ_CHATS_TOUCH_UPDATED_AT.sql");
const QUIZ_CHATS_UPDATE_NAME_BY_ID_AND_USER_ID = loadQuery("QUIZ_CHATS_UPDATE_NAME_BY_ID_AND_USER_ID.sql");
const QUIZ_CHATS_DELETE_BY_ID_AND_USER_ID = loadQuery("QUIZ_CHATS_DELETE_BY_ID_AND_USER_ID.sql");

const QUIZ_ITEMS_SELECT_BY_CHAT_ID = loadQuery("QUIZ_ITEMS_SELECT_BY_CHAT_ID.sql");
const QUIZ_ITEMS_INSERT_NEXT = loadQuery("QUIZ_ITEMS_INSERT_NEXT.sql");
const QUIZ_ITEMS_SELECT_BY_ID_AND_CHAT_ID = loadQuery("QUIZ_ITEMS_SELECT_BY_ID_AND_CHAT_ID.sql");
const QUIZ_ITEMS_SELECT_ANSWER_BY_ID_AND_CHAT_ID = loadQuery("QUIZ_ITEMS_SELECT_ANSWER_BY_ID_AND_CHAT_ID.sql");
const QUIZ_ITEMS_SELECT_DETAIL_BY_ID_AND_CHAT_ID = loadQuery("QUIZ_ITEMS_SELECT_DETAIL_BY_ID_AND_CHAT_ID.sql");
const QUIZ_ITEMS_UPDATE_BY_ID_AND_CHAT_ID = loadQuery("QUIZ_ITEMS_UPDATE_BY_ID_AND_CHAT_ID.sql");
const QUIZ_ITEMS_DELETE_BY_ID_AND_CHAT_ID = loadQuery("QUIZ_ITEMS_DELETE_BY_ID_AND_CHAT_ID.sql");

const QUIZ_CHAT_PROGRESS_SELECT_BY_USER_AND_CHAT = loadQuery("QUIZ_CHAT_PROGRESS_SELECT_BY_USER_AND_CHAT.sql");
const QUIZ_CHAT_PROGRESS_UPSERT_LAST_ITEM = loadQuery("QUIZ_CHAT_PROGRESS_UPSERT_LAST_ITEM.sql");
const QUIZ_CHAT_PROGRESS_RESET = loadQuery("QUIZ_CHAT_PROGRESS_RESET.sql");

const QUIZ_ITEM_ATTEMPTS_UPSERT = loadQuery("QUIZ_ITEM_ATTEMPTS_UPSERT.sql");

const QUIZ_WRONG_ITEMS_UPSERT = loadQuery("QUIZ_WRONG_ITEMS_UPSERT.sql");
const QUIZ_WRONG_ITEMS_SELECT_BY_USER_AND_CHAT = loadQuery("QUIZ_WRONG_ITEMS_SELECT_BY_USER_AND_CHAT.sql");

const QUIZ_CHAT_LOG_SETS_INSERT = loadQuery("QUIZ_CHAT_LOG_SETS_INSERT.sql");
const QUIZ_CHAT_LOG_SETS_SELECT_LATEST_BY_USER_CHAT_MODE = loadQuery("QUIZ_CHAT_LOG_SETS_SELECT_LATEST_BY_USER_CHAT_MODE.sql");
const QUIZ_CHAT_LOG_SETS_DELETE_BY_USER_CHAT_MODE = loadQuery("QUIZ_CHAT_LOG_SETS_DELETE_BY_USER_CHAT_MODE.sql");

const QUIZ_STATS_TOTAL_QUESTIONS_BY_USER = loadQuery("QUIZ_STATS_TOTAL_QUESTIONS_BY_USER.sql");
const QUIZ_STATS_ATTEMPTS_COUNTS_BY_USER = loadQuery("QUIZ_STATS_ATTEMPTS_COUNTS_BY_USER.sql");
const QUIZ_STATS_TODAY_SOLVED_BY_USER = loadQuery("QUIZ_STATS_TODAY_SOLVED_BY_USER.sql");

type UserChatParams = {
  chatId: number;
  userId: number;
};

type ChatIdParams = {
  chatId: number;
};

type ItemChatParams = ChatIdParams & {
  itemId: number;
};

type UserQuizItemParams = UserChatParams & {
  itemId: number;
};

type CreateChatParams = {
  name: string;
  userId: number;
};

type UpdateChatNameParams = UserChatParams & {
  name: string;
};

type CreateItemParams = ChatIdParams & {
  answerText: string;
  questionText: string;
};

type UpdateItemParams = ItemChatParams & {
  answerText: string;
  questionText: string;
};

type ProgressParams = UserChatParams & {
  itemId: number;
  questionNo: number;
};

type AttemptParams = ProgressParams & {
  answeredDate: string;
  isCorrect: boolean;
  userAnswerText: string;
};

type WrongItemParams = ProgressParams;

type QuizLogSetParams = UserChatParams & {
  mode: string;
};

type CreateQuizLogSetParams = QuizLogSetParams & {
  messagesJson: string;
};

type StatsParams = {
  todayDateKey: string;
  userId: number;
};

async function listChatsByUserId(userId: number) {
  return queryRows(QUIZ_CHATS_SELECT_BY_USER_ID, [userId]);
}

async function createChat({ userId, name }: CreateChatParams) {
  const result = await queryResult(QUIZ_CHATS_INSERT, [userId, name]);
  const chatId = result.insertId;

  return queryFirst(QUIZ_CHATS_SELECT_BY_ID_AND_USER_ID, [chatId, userId]);
}

async function getChatByIdAndUserId({ chatId, userId }: UserChatParams) {
  return queryFirst(QUIZ_CHATS_SELECT_BY_ID_AND_USER_ID, [chatId, userId]);
}

async function updateChatNameByIdAndUserId({ chatId, userId, name }: UpdateChatNameParams) {
  const result = await queryResult(QUIZ_CHATS_UPDATE_NAME_BY_ID_AND_USER_ID, [name, chatId, userId]);
  return result.affectedRows || 0;
}

async function deleteChatByIdAndUserId({ chatId, userId }: UserChatParams) {
  const result = await queryResult(QUIZ_CHATS_DELETE_BY_ID_AND_USER_ID, [chatId, userId]);
  return result.affectedRows || 0;
}

async function listItemsByChatId(chatId: number) {
  return queryRows(QUIZ_ITEMS_SELECT_BY_CHAT_ID, [chatId]);
}

async function createItemNext({ chatId, questionText, answerText }: CreateItemParams) {
  return withTransaction(async (tx) => {
    const result = await tx.queryResult(QUIZ_ITEMS_INSERT_NEXT, [chatId, questionText, answerText, chatId]);
    const itemId = result.insertId;

    await tx.queryResult(QUIZ_CHATS_TOUCH_UPDATED_AT, [chatId]);

    return tx.queryFirst(QUIZ_ITEMS_SELECT_BY_ID_AND_CHAT_ID, [itemId, chatId]);
  });
}

async function getItemAnswerByIdAndChatId({ itemId, chatId }: ItemChatParams) {
  return queryFirst(QUIZ_ITEMS_SELECT_ANSWER_BY_ID_AND_CHAT_ID, [itemId, chatId]);
}

async function getItemDetailByIdAndChatId({ itemId, chatId }: ItemChatParams) {
  return queryFirst(QUIZ_ITEMS_SELECT_DETAIL_BY_ID_AND_CHAT_ID, [itemId, chatId]);
}

async function updateItemByIdAndChatId({ itemId, chatId, questionText, answerText }: UpdateItemParams) {
  return withTransaction(async (tx) => {
    const result = await tx.queryResult(QUIZ_ITEMS_UPDATE_BY_ID_AND_CHAT_ID, [questionText, answerText, itemId, chatId]);
    if (!result.affectedRows) return null;

    await tx.queryResult(QUIZ_CHATS_TOUCH_UPDATED_AT, [chatId]);
    return tx.queryFirst(QUIZ_ITEMS_SELECT_DETAIL_BY_ID_AND_CHAT_ID, [itemId, chatId]);
  });
}

async function deleteItemByIdAndChatId({ itemId, chatId, userId }: UserQuizItemParams) {
  return withTransaction(async (tx) => {
    const result = await tx.queryResult(QUIZ_ITEMS_DELETE_BY_ID_AND_CHAT_ID, [itemId, chatId]);
    if (!result.affectedRows) return 0;

    await tx.queryResult(QUIZ_CHATS_TOUCH_UPDATED_AT, [chatId]);
    await tx.queryResult(QUIZ_CHAT_PROGRESS_RESET, [userId, chatId]);
    return result.affectedRows || 0;
  });
}

async function getChatProgressByUserIdAndChatId({ userId, chatId }: UserChatParams) {
  return queryFirst(QUIZ_CHAT_PROGRESS_SELECT_BY_USER_AND_CHAT, [userId, chatId]);
}

async function resetChatProgress({ userId, chatId }: UserChatParams) {
  await withTransaction(async (tx) => {
    await tx.queryResult(QUIZ_CHAT_PROGRESS_RESET, [userId, chatId]);
    await tx.queryResult(QUIZ_CHATS_TOUCH_UPDATED_AT, [chatId]);
  });
}

async function recordQuizItemAttempt({
  userId,
  chatId,
  itemId,
  questionNo,
  isCorrect,
  answeredDate,
  userAnswerText,
}: AttemptParams) {
  await withTransaction(async (tx) => {
    await tx.queryResult(QUIZ_CHAT_PROGRESS_UPSERT_LAST_ITEM, [userId, chatId, itemId, questionNo]);
    await tx.queryResult(QUIZ_CHATS_TOUCH_UPDATED_AT, [chatId]);
    await tx.queryResult(QUIZ_ITEM_ATTEMPTS_UPSERT, [
      userId,
      chatId,
      itemId,
      questionNo,
      isCorrect ? 1 : 0,
      userAnswerText ?? "",
      answeredDate,
    ]);
  });
}

async function upsertWrongItem({ userId, chatId, itemId, questionNo }: WrongItemParams) {
  await queryResult(QUIZ_WRONG_ITEMS_UPSERT, [userId, chatId, itemId, questionNo]);
}

async function listWrongItemsByUserAndChat({ userId, chatId }: UserChatParams) {
  return queryRows(QUIZ_WRONG_ITEMS_SELECT_BY_USER_AND_CHAT, [userId, chatId]);
}

async function replaceQuizChatLogSet({ userId, chatId, mode, messagesJson }: CreateQuizLogSetParams) {
  return withTransaction(async (tx) => {
    await tx.queryResult(QUIZ_CHAT_LOG_SETS_DELETE_BY_USER_CHAT_MODE, [userId, chatId, mode]);
    const result = await tx.queryResult(QUIZ_CHAT_LOG_SETS_INSERT, [userId, chatId, mode, messagesJson]);
    return result.insertId || 0;
  });
}

async function deleteQuizChatLogSets({ userId, chatId, mode }: QuizLogSetParams) {
  const result = await queryResult(QUIZ_CHAT_LOG_SETS_DELETE_BY_USER_CHAT_MODE, [userId, chatId, mode]);
  return result.affectedRows || 0;
}

async function getLatestQuizChatLogSet({ userId, chatId, mode }: QuizLogSetParams) {
  return queryFirst(QUIZ_CHAT_LOG_SETS_SELECT_LATEST_BY_USER_CHAT_MODE, [userId, chatId, mode]);
}

async function getQuizStatsByUserId({ userId, todayDateKey }: StatsParams) {
  const totalRow = await queryFirst<RowDataPacket>(QUIZ_STATS_TOTAL_QUESTIONS_BY_USER, [userId]);
  const attemptRow = await queryFirst<RowDataPacket>(QUIZ_STATS_ATTEMPTS_COUNTS_BY_USER, [userId]);
  const todayRow = await queryFirst<RowDataPacket>(QUIZ_STATS_TODAY_SOLVED_BY_USER, [userId, todayDateKey]);

  const totalQuestions = Number(totalRow?.TOTAL_QUESTIONS) || 0;
  const totalAttempts = Number(attemptRow?.TOTAL_ATTEMPTS) || 0;
  const correctAttempts = Number(attemptRow?.CORRECT_ATTEMPTS) || 0;
  const todaySolved = Number(todayRow?.TODAY_SOLVED) || 0;

  return { totalQuestions, totalAttempts, correctAttempts, todaySolved };
}

export {
  createChat,
  createItemNext,
  deleteChatByIdAndUserId,
  deleteItemByIdAndChatId,
  deleteQuizChatLogSets,
  getChatByIdAndUserId,
  getChatProgressByUserIdAndChatId,
  getItemAnswerByIdAndChatId,
  getItemDetailByIdAndChatId,
  getLatestQuizChatLogSet,
  getQuizStatsByUserId,
  listChatsByUserId,
  listItemsByChatId,
  listWrongItemsByUserAndChat,
  recordQuizItemAttempt,
  replaceQuizChatLogSet,
  resetChatProgress,
  updateChatNameByIdAndUserId,
  updateItemByIdAndChatId,
  upsertWrongItem,
};
