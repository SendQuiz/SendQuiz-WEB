import { listItems, createItem } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(listItems, { authenticated: true });
export const POST = routeHandler(createItem, { authenticated: true });
