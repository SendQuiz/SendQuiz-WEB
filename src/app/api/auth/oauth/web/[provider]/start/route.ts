import { startWebOAuth } from '@/controllers/oauthController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(startWebOAuth);
