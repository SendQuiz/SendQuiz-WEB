import { resetProgress } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(resetProgress, { authenticated: true });
