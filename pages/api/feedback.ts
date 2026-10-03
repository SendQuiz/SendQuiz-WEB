import { submitFeedback } from '../../src/controllers/feedbackController';
import { createApiHandler } from '../../src/utils/nextApi';

export default createApiHandler({ methods: ['POST'], controller: submitFeedback });
