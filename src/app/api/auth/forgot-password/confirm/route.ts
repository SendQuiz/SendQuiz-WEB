import { confirmPasswordReset } from '@/controllers/authController';
import { routeHandler } from '@/utils/routeHandler';

export const POST = routeHandler(confirmPasswordReset);
