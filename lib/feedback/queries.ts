import { queryResult } from "@/lib/db/client";
import { loadQuery } from "@/lib/db/sql";

const FEEDBACK_INSERT = loadQuery("FEEDBACK_INSERT.sql");

async function insertFeedback(message: string) {
  await queryResult(FEEDBACK_INSERT, [message]);
}

export { insertFeedback };
