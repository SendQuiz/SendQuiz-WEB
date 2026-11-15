import { resetProgress } from '@/lib/quiz/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(resetProgress, { authenticated: true });
