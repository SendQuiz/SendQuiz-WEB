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
} from "@/lib/quiz/queries";
import { requireAuthenticatedUserId, requireBodyString, requireRouteId } from "@/lib/http/guards";
import { getTodayDateKey } from "@/lib/date";
import { API_MESSAGES } from "@/lib/http/messages";
import {
  isAnswerCorrect,
  normalizeQuizLogMessages,
  serializeChatProgress,
  serializeQuizLogSet,
  serializeQuizStats,
  toPositiveNumber,
} from "@/lib/quiz/payload";
import { readBodyArray, readBodyString } from "@/lib/http/request";
import type { RequestContext } from "@/lib/http/types";

function requireChatId(req: RequestContext) {
  return requireRouteId(req, "chatId", API_MESSAGES.CHAT_NOT_FOUND);
}

async function requireChatContext(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const chatId = requireChatId(req);

  const chat = await getChatByIdAndUserId({ chatId, userId });
  if (!chat) {
    throw Response.json(API_MESSAGES.CHAT_NOT_FOUND, { status: 404 });
  }

  return { userId, chatId, chat };
}

async function requireQuizItemContext(req: RequestContext) {
  const context = await requireChatContext(req);

  const itemId = requireRouteId(req, "itemId", API_MESSAGES.QUIZ_ITEM_NOT_FOUND);

  return { ...context, itemId };
}

function requireQuizItemTextInput(req: RequestContext) {
  const questionText = requireBodyString(req, "questionText", API_MESSAGES.QUESTION_TEXT_REQUIRED);

  const answerText = requireBodyString(req, "answerText", API_MESSAGES.ANSWER_TEXT_REQUIRED);

  return { answerText, questionText };
}

async function listChats(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const chats = await listChatsByUserId(userId);
  return Response.json({ ...API_MESSAGES.OK, chats });
}

async function createChatHandler(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const name = requireBodyString(req, "name", API_MESSAGES.CHAT_NAME_REQUIRED);

  const chat = await createChat({ userId, name });
  return Response.json({ ...API_MESSAGES.OK, chat }, { status: 201 });
}

async function renameChat(req: RequestContext) {
  const context = await requireChatContext(req);

  const name = requireBodyString(req, "name", API_MESSAGES.CHAT_NAME_REQUIRED);

  const { chatId, userId } = context;
  await updateChatNameByIdAndUserId({ chatId, userId, name });
  const updated = await getChatByIdAndUserId({ chatId, userId });
  if (!updated) return Response.json(API_MESSAGES.CHAT_NOT_FOUND, { status: 404 });

  return Response.json({ ...API_MESSAGES.OK, chat: updated });
}

async function deleteChat(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const chatId = requireChatId(req);

  const affected = await deleteChatByIdAndUserId({ chatId, userId });
  if (!affected) return Response.json(API_MESSAGES.CHAT_NOT_FOUND, { status: 404 });

  return Response.json({ ...API_MESSAGES.OK });
}

async function listItems(req: RequestContext) {
  const context = await requireChatContext(req);

  const items = await listItemsByChatId(context.chatId);
  return Response.json({ ...API_MESSAGES.OK, items });
}

async function getItemDetail(req: RequestContext) {
  const context = await requireQuizItemContext(req);

  const item = await getItemDetailByIdAndChatId(context);
  if (!item) return Response.json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND, { status: 404 });

  return Response.json({ ...API_MESSAGES.OK, item });
}

async function createItem(req: RequestContext) {
  const context = await requireChatContext(req);

  const input = requireQuizItemTextInput(req);

  const item = await createItemNext({ chatId: context.chatId, ...input });
  return Response.json({ ...API_MESSAGES.OK, item }, { status: 201 });
}

async function updateItem(req: RequestContext) {
  const context = await requireQuizItemContext(req);

  const input = requireQuizItemTextInput(req);

  const { chatId, itemId } = context;
  const item = await updateItemByIdAndChatId({ itemId, chatId, ...input });
  if (!item) return Response.json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND, { status: 404 });

  return Response.json({ ...API_MESSAGES.OK, item });
}

async function deleteItem(req: RequestContext) {
  const context = await requireQuizItemContext(req);

  const { chatId, itemId, userId } = context;
  const affected = await deleteItemByIdAndChatId({ itemId, chatId, userId });
  if (!affected) return Response.json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND, { status: 404 });

  return Response.json({ ...API_MESSAGES.OK });
}

async function submitAnswer(req: RequestContext) {
  const context = await requireQuizItemContext(req);

  const { chatId, itemId, userId } = context;
  const row = await getItemAnswerByIdAndChatId({ itemId, chatId });
  if (!row) return Response.json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND, { status: 404 });

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

  return Response.json({ ...API_MESSAGES.OK, correctAnswer, isCorrect });
}

async function addWrongItem(req: RequestContext) {
  const context = await requireQuizItemContext(req);

  const { chatId, itemId, userId } = context;
  const item = await getItemDetailByIdAndChatId({ itemId, chatId });
  if (!item) return Response.json(API_MESSAGES.QUIZ_ITEM_NOT_FOUND, { status: 404 });

  await upsertWrongItem({ userId, chatId, itemId, questionNo: toPositiveNumber(item.QUESTION_NO) ?? 0 });

  return Response.json({ ...API_MESSAGES.OK });
}

async function listWrongItems(req: RequestContext) {
  const context = await requireChatContext(req);

  const { chatId, userId } = context;
  const items = await listWrongItemsByUserAndChat({ userId, chatId });
  return Response.json({ ...API_MESSAGES.OK, items });
}

async function saveQuizLogSet(req: RequestContext) {
  const context = await requireChatContext(req);

  const messages = normalizeQuizLogMessages(readBodyArray(req, "messages"));
  if (!messages.length) return Response.json(API_MESSAGES.QUIZ_LOG_MESSAGES_REQUIRED, { status: 400 });

  const { chatId, userId } = context;
  const setId = await replaceQuizChatLogSet({
    userId,
    chatId,
    mode: "quiz",
    messagesJson: JSON.stringify(messages),
  });

  return Response.json({ ...API_MESSAGES.OK, setId }, { status: 201 });
}

async function clearQuizLogSets(req: RequestContext) {
  const context = await requireChatContext(req);

  await deleteQuizChatLogSets({ userId: context.userId, chatId: context.chatId, mode: "quiz" });

  return Response.json({ ...API_MESSAGES.OK });
}

async function getLatestQuizLogSetHandler(req: RequestContext) {
  const context = await requireChatContext(req);

  const row = await getLatestQuizChatLogSet({ userId: context.userId, chatId: context.chatId, mode: "quiz" });
  if (!row) return Response.json({ ...API_MESSAGES.OK, set: null });

  return Response.json({ ...API_MESSAGES.OK, set: serializeQuizLogSet(row) });
}

async function getProgress(req: RequestContext) {
  const context = await requireChatContext(req);

  const row = await getChatProgressByUserIdAndChatId({ userId: context.userId, chatId: context.chatId });
  return Response.json({ ...API_MESSAGES.OK, progress: serializeChatProgress(row) });
}

async function resetProgress(req: RequestContext) {
  const context = await requireChatContext(req);

  await resetChatProgress({ userId: context.userId, chatId: context.chatId });
  return Response.json({ ...API_MESSAGES.OK });
}

async function getStats(req: RequestContext) {
  const userId = requireAuthenticatedUserId(req);

  const today = getTodayDateKey();
  const stats = await getQuizStatsByUserId({
    userId,
    todayDateKey: today,
  });

  return Response.json({ ...API_MESSAGES.OK, stats: serializeQuizStats(stats) });
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
