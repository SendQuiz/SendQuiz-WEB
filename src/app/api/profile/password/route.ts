import { changePassword } from '@/controllers/profileController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(changePassword, { authenticated: true });
