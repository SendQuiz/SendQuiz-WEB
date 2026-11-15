import { getItemDetail, updateItem, deleteItem } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(getItemDetail, { authenticated: true });
export const PATCH = routeHandler(updateItem, { authenticated: true });
export const DELETE = routeHandler(deleteItem, { authenticated: true });
