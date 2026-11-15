import { insertFeedback } from "@/lib/feedback/queries";
import { requireBodyString } from "@/lib/http/guards";
import { API_MESSAGES } from "@/lib/http/messages";
import type { RequestContext } from "@/lib/http/types";

async function submitFeedback(req: RequestContext) {
  const message = requireBodyString(req, "message", API_MESSAGES.FEEDBACK_MESSAGE_REQUIRED);

  await insertFeedback(message);
  return Response.json(API_MESSAGES.OK);
}

export { submitFeedback };
