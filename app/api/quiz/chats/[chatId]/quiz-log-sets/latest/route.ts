import { getLatestQuizLogSet } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(getLatestQuizLogSet, { authenticated: true });
