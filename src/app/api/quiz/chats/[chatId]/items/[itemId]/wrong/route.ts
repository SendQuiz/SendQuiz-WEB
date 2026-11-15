import { addWrongItem } from '@/controllers/quizController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(addWrongItem, { authenticated: true });
