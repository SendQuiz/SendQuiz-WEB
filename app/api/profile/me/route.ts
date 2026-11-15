import { getMe } from '@/lib/profile/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const GET = routeHandler(getMe, { authenticated: true });
