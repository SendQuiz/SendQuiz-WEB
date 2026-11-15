import { getStats } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(getStats, { authenticated: true });
