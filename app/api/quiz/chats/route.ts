import { listChats, createChat } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(listChats, { authenticated: true });
export const POST = routeHandler(createChat, { authenticated: true });
