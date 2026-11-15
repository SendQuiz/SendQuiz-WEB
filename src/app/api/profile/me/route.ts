import { getMe } from '@/controllers/profileController';
import { routeHandler } from '@/utils/routeHandler';

export const GET = routeHandler(getMe, { authenticated: true });
