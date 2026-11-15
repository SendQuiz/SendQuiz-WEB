import { submitAnswer } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(submitAnswer, { authenticated: true });
