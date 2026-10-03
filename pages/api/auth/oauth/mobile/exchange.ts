import { exchangeMobileOAuth } from '../../../../../src/controllers/oauthController';
import { createApiHandler } from '../../../../../src/utils/nextApi';

export default createApiHandler({ methods: ['POST'], controller: exchangeMobileOAuth });
