import { completeWebOAuth } from '@/controllers/oauthController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(completeWebOAuth);
export const POST = routeHandler(completeWebOAuth);
