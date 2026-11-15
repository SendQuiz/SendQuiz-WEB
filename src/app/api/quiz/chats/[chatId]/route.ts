import { renameChat, deleteChat } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const PATCH = routeHandler(renameChat, { authenticated: true });
export const DELETE = routeHandler(deleteChat, { authenticated: true });
