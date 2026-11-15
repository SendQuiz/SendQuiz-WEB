import { listWrongItems } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(listWrongItems, { authenticated: true });
