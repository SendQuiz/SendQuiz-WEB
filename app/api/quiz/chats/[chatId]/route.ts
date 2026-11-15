import { renameChat, deleteChat } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const PATCH = routeHandler(renameChat, { authenticated: true });
export const DELETE = routeHandler(deleteChat, { authenticated: true });
