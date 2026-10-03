import { changePassword } from '../../../src/controllers/profileController';
import { createApiHandler } from '../../../src/utils/nextApi';

export default createApiHandler({ methods: ['POST'], authenticated: true, controller: changePassword });
