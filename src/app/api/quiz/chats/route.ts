import { listChats, createChat } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(listChats, { authenticated: true });
export const POST = routeHandler(createChat, { authenticated: true });
