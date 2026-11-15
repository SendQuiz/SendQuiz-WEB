import { getLatestQuizLogSet } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(getLatestQuizLogSet, { authenticated: true });
