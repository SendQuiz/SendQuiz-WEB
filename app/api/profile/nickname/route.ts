import { updateNickname } from '@/lib/profile/handlers';
import { routeHandler } from '@/lib/http/route-handler';

export const PATCH = routeHandler(updateNickname, { authenticated: true });
