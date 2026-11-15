import { listItems, createItem } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(listItems, { authenticated: true });
export const POST = routeHandler(createItem, { authenticated: true });
