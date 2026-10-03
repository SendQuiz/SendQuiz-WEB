import { startWebOAuth } from '../../../../../../src/controllers/oauthController';
import { createApiHandler } from '../../../../../../src/utils/nextApi';

export default createApiHandler({ methods: ['GET'], controller: startWebOAuth });
