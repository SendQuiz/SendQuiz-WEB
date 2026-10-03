import { getMe } from '../../../src/controllers/profileController';
import { createApiHandler } from '../../../src/utils/nextApi';

export default createApiHandler({ methods: ['GET'], authenticated: true, controller: getMe });
