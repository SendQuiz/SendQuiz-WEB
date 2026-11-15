import { withdraw } from '@/controllers/profileController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(withdraw, { authenticated: true });
