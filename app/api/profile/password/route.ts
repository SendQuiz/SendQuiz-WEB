import { changePassword } from '@/lib/profile/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(changePassword, { authenticated: true });
