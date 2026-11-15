import { addWrongItem } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(addWrongItem, { authenticated: true });
