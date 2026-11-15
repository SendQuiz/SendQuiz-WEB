import { saveQuizLogSet, clearQuizLogSets } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(saveQuizLogSet, { authenticated: true });
export const DELETE = routeHandler(clearQuizLogSets, { authenticated: true });
