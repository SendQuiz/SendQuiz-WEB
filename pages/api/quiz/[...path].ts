import * as quizController from '../../../src/controllers/quizController';
import { createAuthenticatedRoutedApiHandler } from '../../../src/utils/routedApi';
import type { RouteDefinition } from '../../../src/utils/routedApi';

const routes: RouteDefinition[] = [
  { method: 'GET', path: 'chats', controller: quizController.listChats },
  { method: 'POST', path: 'chats', controller: quizController.createChat },
  { method: 'GET', path: 'stats', controller: quizController.getStats },
  { method: 'PATCH', path: 'chats/:chatId', controller: quizController.renameChat },
  { method: 'DELETE', path: 'chats/:chatId', controller: quizController.deleteChat },
  { method: 'GET', path: 'chats/:chatId/items', controller: quizController.listItems },
  { method: 'POST', path: 'chats/:chatId/items', controller: quizController.createItem },
  { method: 'GET', path: 'chats/:chatId/items/:itemId', controller: quizController.getItemDetail },
  { method: 'PATCH', path: 'chats/:chatId/items/:itemId', controller: quizController.updateItem },
  { method: 'DELETE', path: 'chats/:chatId/items/:itemId', controller: quizController.deleteItem },
  { method: 'POST', path: 'chats/:chatId/items/:itemId/answer', controller: quizController.submitAnswer },
  { method: 'POST', path: 'chats/:chatId/items/:itemId/wrong', controller: quizController.addWrongItem },
  { method: 'GET', path: 'chats/:chatId/wrong-items', controller: quizController.listWrongItems },
  { method: 'POST', path: 'chats/:chatId/quiz-log-sets', controller: quizController.saveQuizLogSet },
  { method: 'DELETE', path: 'chats/:chatId/quiz-log-sets', controller: quizController.clearQuizLogSets },
  { method: 'GET', path: 'chats/:chatId/quiz-log-sets/latest', controller: quizController.getLatestQuizLogSet },
  { method: 'GET', path: 'chats/:chatId/progress', controller: quizController.getProgress },
  { method: 'POST', path: 'chats/:chatId/progress/reset', controller: quizController.resetProgress },
];

export default createAuthenticatedRoutedApiHandler(routes);
