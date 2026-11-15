import { saveQuizLogSet, clearQuizLogSets } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(saveQuizLogSet, { authenticated: true });
export const DELETE = routeHandler(clearQuizLogSets, { authenticated: true });
