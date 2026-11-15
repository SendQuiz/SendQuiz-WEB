import { login } from '@/controllers/authController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(login);
