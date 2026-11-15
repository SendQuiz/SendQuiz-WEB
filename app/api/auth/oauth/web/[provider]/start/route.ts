import { startWebOAuth } from '@/lib/auth/oauth-handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(startWebOAuth);
