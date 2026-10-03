import {
  listChatsByUserId,
  createChat,
  getChatByIdAndUserId,
  updateChatNameByIdAndUserId,
  deleteChatByIdAndUserId,
  listItemsByChatId,
  createItemNext,
  getItemAnswerByIdAndChatId,
  getItemDetailByIdAndChatId,
  updateItemByIdAndChatId,
  deleteItemByIdAndChatId,
  getChatProgressByUserIdAndChatId,
  resetChatProgress,
  recordQuizItemAttempt,
  upsertWrongItem,
  listWrongItemsByUserAndChat,
  deleteQuizChatLogSets,
  getLatestQuizChatLogSet,
  getQuizStatsByUserId,
  replaceQuizChatLogSet,
} from "../models/quizModel";
import { requireAuthenticatedUserId, requireBodyString, requireRouteId } from "./guards";
import { getTodayDateKey } from "../utils/dateUtils";
import { API_MESSAGES } from "../utils/messages";
import {
  isAnswerCorrect,
  normalizeQuizLogMessages,
  serializeChatProgress,
  serializeQuizLogSet,
  serializeQuizStats,
  toPositiveNumber,
} from "../utils/quizPayload";
import { readBodyArray, readBodyString } from "../utils/request";
import type { ApiResponse, RoutedApiRequest } from "../types/api";

function requireChatId(req: RoutedApiRequest, res: ApiResponse) {
  return requireRouteId(req, res, "chatId", API_MESSAGES.CHAT_NOT_FOUND);
}

async function requireChatContext(req: RoutedApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return null;

  const chatId = requireChatId(req, res);
  if (!chatId) return null;

  const chat = await getChatByIdAndUserId({ chatId, userId });
  if (!chat) {
    res.status(404).json(API_MESSAGES.CHAT_NOT_FOUND);
    return null;
  }

  return { userId, chatId, chat };
}

async function requireQuizItemContext(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return null;

  const itemId = requireRouteId(req, res, "itemId", API_MESSAGES.QUIZ_ITEM_NOT_FOUND);
  if (!itemId) return null;

  return { ...context, itemId };
}

function requireQuizItemTextInput(req: RoutedApiRequest, res: ApiResponse) {
  const questionText = requireBodyString(req, res, "questionText", API_MESSAGES.QUESTION_TEXT_REQUIRED);
  if (!questionText) return null;

  const answerText = requireBodyString(req, res, "answerText", API_MESSAGES.ANSWER_TEXT_REQUIRED);
  if (!answerText) return null;

  return { answerText, questionText };
}

async function listChats(req: RoutedApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return;

  const chats = await listChatsByUserId(userId);
  return res.json({ ...API_MESSAGES.OK, chats });
}

async function createChatHandler(req: RoutedApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return;

  const name = requireBodyString(req, res, "name", API_MESSAGES.CHAT_NAME_REQUIRED);
  if (!name) return;

  const chat = await createChat({ userId, name });
  return res.status(201).json({ ...API_MESSAGES.OK, chat });
}

async function renameChat(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const name = requireBodyString(req, res, "name", API_MESSAGES.CHAT_NAME_REQUIRED);
  if (!name) return;

  const { chatId, userId } = context;
  await updateChatNameByIdAndUserId({ chatId, userId, name });
  const updated = await getChatByIdAndUserId({ chatId, userId });
  if (!updated) return res.status(404).json(API_MESSAGES.CHAT_NOT_FOUND);

  return res.json({ ...API_MESSAGES.OK, chat: updated });
}

async function deleteChat(req: RoutedApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return;

  const chatId = requireChatId(req, res);
  if (!chatId) return;

  const affected = await deleteChatByIdAndUserId({ chatId, userId });
  if (!affected) return res.status(404).json(API_MESSAGES.CHAT_NOT_FOUND);

  return res.json({ ...API_MESSAGES.OK });
}

async function listItems(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const items = await listItemsByChatId(context.chatId);
  return res.json({ ...API_MESSAGES.OK, items });
}

async function getItemDetail(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireQuizItemContext(req, res);
  if (!context) return;

  const item = await getItemDetailByIdAndChatId(context);
  if (!item) return res.status(404).json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  return res.json({ ...API_MESSAGES.OK, item });
}

async function createItem(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const input = requireQuizItemTextInput(req, res);
  if (!input) return;

  const item = await createItemNext({ chatId: context.chatId, ...input });
  return res.status(201).json({ ...API_MESSAGES.OK, item });
}

async function updateItem(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireQuizItemContext(req, res);
  if (!context) return;

  const input = requireQuizItemTextInput(req, res);
  if (!input) return;

  const { chatId, itemId } = context;
  const item = await updateItemByIdAndChatId({ itemId, chatId, ...input });
  if (!item) return res.status(404).json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  return res.json({ ...API_MESSAGES.OK, item });
}

async function deleteItem(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireQuizItemContext(req, res);
  if (!context) return;

  const { chatId, itemId, userId } = context;
  const affected = await deleteItemByIdAndChatId({ itemId, chatId, userId });
  if (!affected) return res.status(404).json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  return res.json({ ...API_MESSAGES.OK });
}

async function submitAnswer(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireQuizItemContext(req, res);
  if (!context) return;

  const { chatId, itemId, userId } = context;
  const row = await getItemAnswerByIdAndChatId({ itemId, chatId });
  if (!row) return res.status(404).json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  const userAnswer = readBodyString(req, "answer", { trim: false });
  const correctAnswer = String(row.ANSWER_TEXT ?? "");

  const isCorrect = isAnswerCorrect(userAnswer, correctAnswer);

  const questionNo = toPositiveNumber(row.QUESTION_NO);
  if (questionNo) {
    await recordQuizItemAttempt({
      userId,
      chatId,
      itemId,
      questionNo,
      isCorrect,
      userAnswerText: userAnswer,
      answeredDate: getTodayDateKey(),
    });
  }

  return res.json({ ...API_MESSAGES.OK, correctAnswer, isCorrect });
}

async function addWrongItem(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireQuizItemContext(req, res);
  if (!context) return;

  const { chatId, itemId, userId } = context;
  const item = await getItemDetailByIdAndChatId({ itemId, chatId });
  if (!item) return res.status(404).json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  await upsertWrongItem({ userId, chatId, itemId, questionNo: toPositiveNumber(item.QUESTION_NO) ?? 0 });

  return res.json({ ...API_MESSAGES.OK });
}

async function listWrongItems(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const { chatId, userId } = context;
  const items = await listWrongItemsByUserAndChat({ userId, chatId });
  return res.json({ ...API_MESSAGES.OK, items });
}

async function saveQuizLogSet(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const messages = normalizeQuizLogMessages(readBodyArray(req, "messages"));
  if (!messages.length) return res.status(400).json(API_MESSAGES.QUIZ_LOG_MESSAGES_REQUIRED);

  const { chatId, userId } = context;
  const setId = await replaceQuizChatLogSet({
    userId,
    chatId,
    mode: "quiz",
    messagesJson: JSON.stringify(messages),
  });

  return res.status(201).json({ ...API_MESSAGES.OK, setId });
}

async function clearQuizLogSets(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  await deleteQuizChatLogSets({ userId: context.userId, chatId: context.chatId, mode: "quiz" });

  return res.json({ ...API_MESSAGES.OK });
}

async function getLatestQuizLogSetHandler(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const row = await getLatestQuizChatLogSet({ userId: context.userId, chatId: context.chatId, mode: "quiz" });
  if (!row) return res.json({ ...API_MESSAGES.OK, set: null });

  return res.json({ ...API_MESSAGES.OK, set: serializeQuizLogSet(row) });
}

async function getProgress(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  const row = await getChatProgressByUserIdAndChatId({ userId: context.userId, chatId: context.chatId });
  return res.json({ ...API_MESSAGES.OK, progress: serializeChatProgress(row) });
}

async function resetProgress(req: RoutedApiRequest, res: ApiResponse) {
  const context = await requireChatContext(req, res);
  if (!context) return;

  await resetChatProgress({ userId: context.userId, chatId: context.chatId });
  return res.json({ ...API_MESSAGES.OK });
}

async function getStats(req: RoutedApiRequest, res: ApiResponse) {
  const userId = requireAuthenticatedUserId(req, res);
  if (!userId) return;

  const today = getTodayDateKey();
  const stats = await getQuizStatsByUserId({
    userId,
    todayDateKey: today,
  });

  return res.json({ ...API_MESSAGES.OK, stats: serializeQuizStats(stats) });
}

export {
  addWrongItem,
  clearQuizLogSets,
  createChatHandler as createChat,
  createItem,
  deleteChat,
  deleteItem,
  getItemDetail,
  getLatestQuizLogSetHandler as getLatestQuizLogSet,
  getProgress,
  getStats,
  listChats,
  listItems,
  listWrongItems,
  renameChat,
  resetProgress,
  saveQuizLogSet,
  submitAnswer,
  updateItem,
};
