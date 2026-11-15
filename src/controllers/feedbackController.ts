import { insertFeedback } from "../models/feedbackModel";
import { requireBodyString } from "./guards";
import { API_MESSAGES } from "../utils/messages";
import type { RequestContext } from "../types/api";

async function submitFeedback(req: RequestContext) {
  const message = requireBodyString(req, "message", API_MESSAGES.FEEDBACK_MESSAGE_REQUIRED);

  await insertFeedback(message);
  return Response.json(API_MESSAGES.OK);
}

export { submitFeedback };
