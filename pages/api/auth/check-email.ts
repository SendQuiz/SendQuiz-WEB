import { checkEmail } from '../../../src/controllers/authController';
import { createApiHandler } from '../../../src/utils/nextApi';

export default createApiHandler({ methods: ['POST'], controller: checkEmail });
