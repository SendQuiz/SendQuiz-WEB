import { listWrongItems } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(listWrongItems, { authenticated: true });
