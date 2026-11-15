import { submitAnswer } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(submitAnswer, { authenticated: true });
