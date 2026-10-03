import { insertFeedback } from "../models/feedbackModel";
import { requireBodyString } from "./guards";
import { API_MESSAGES } from "../utils/messages";
import type { ApiRequest, ApiResponse } from "../types/api";

async function submitFeedback(req: ApiRequest, res: ApiResponse) {
  const message = requireBodyString(req, res, "message", API_MESSAGES.FEEDBACK_MESSAGE_REQUIRED);
  if (!message) return;

  await insertFeedback(message);
  return res.json(API_MESSAGES.OK);
}

export { submitFeedback };
