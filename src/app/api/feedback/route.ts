import { submitFeedback } from '@/controllers/feedbackController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(submitFeedback);
