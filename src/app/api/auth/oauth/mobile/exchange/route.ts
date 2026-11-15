import { exchangeMobileOAuth } from '@/controllers/oauthController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(exchangeMobileOAuth);
