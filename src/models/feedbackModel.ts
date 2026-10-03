import { queryResult } from "../utils/db";
import { loadQuery } from "../utils/sql";

const FEEDBACK_INSERT = loadQuery("FEEDBACK_INSERT.sql");

async function insertFeedback(message: string) {
  await queryResult(FEEDBACK_INSERT, [message]);
}

export { insertFeedback };
