import { updateNickname } from '@/controllers/profileController';
import { routeHandler } from '@/utils/routeHandler';

export const PATCH = routeHandler(updateNickname, { authenticated: true });
