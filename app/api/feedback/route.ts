import { submitFeedback } from '@/lib/feedback/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(submitFeedback);
