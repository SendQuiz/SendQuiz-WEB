import { updateNickname } from '../../../src/controllers/profileController';
import { createApiHandler } from '../../../src/utils/nextApi';

export default createApiHandler({ methods: ['PATCH'], authenticated: true, controller: updateNickname });
