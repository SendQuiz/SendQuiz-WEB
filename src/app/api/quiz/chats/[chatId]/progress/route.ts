import { getProgress } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(getProgress, { authenticated: true });
