import { getItemDetail, updateItem, deleteItem } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(getItemDetail, { authenticated: true });
export const PATCH = routeHandler(updateItem, { authenticated: true });
export const DELETE = routeHandler(deleteItem, { authenticated: true });
