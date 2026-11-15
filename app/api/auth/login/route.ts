import { login } from '@/lib/auth/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const POST = routeHandler(login);
