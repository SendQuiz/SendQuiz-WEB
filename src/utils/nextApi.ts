import type { NextApiRequest, NextApiResponse } from "next";

import { authenticate } from "./auth";
import { API_MESSAGES } from "./messages";
import { getHttpStatus } from "./httpError";
import type { ApiController, ApiRequest } from "../types/api";

type ApiHandlerOptions = {
  authenticated?: boolean;
  controller: ApiController;
  methods: string[];
};

function handleApiError(error: unknown, req: NextApiRequest, res: NextApiResponse) {
  const status = getHttpStatus(error);
  const details = error instanceof Error ? { name: error.name, message: error.message } : { name: undefined, message: undefined };
  console.error(
    `[오류내용] BACKEND_ERROR ${JSON.stringify({
      name: details.name,
      message: details.message,
      status,
      method: req?.method,
      path: req?.url,
    })}`
  );
  return res.status(status).json(API_MESSAGES.INTERNAL_SERVER_ERROR);
}

async function runController<TRequest extends ApiRequest>(
  controller: ApiController<TRequest>,
  req: TRequest,
  res: NextApiResponse,
) {
  try {
    await controller(req, res, (error) => {
      if (error && !res.writableEnded) handleApiError(error, req, res);
    });
  } catch (error) {
    if (!res.writableEnded) handleApiError(error, req, res);
  }
}

function methodNotAllowed(res: NextApiResponse) {
  return res.status(405).json({ code: "BE-405-000", message: "METHOD_NOT_ALLOWED" });
}

function allowMethods(req: NextApiRequest, res: NextApiResponse, methods: string[]) {
  if (req.method && methods.includes(req.method)) return true;
  methodNotAllowed(res);
  return false;
}

function notFound(res: NextApiResponse) {
  return res.status(404).json(API_MESSAGES.NOT_FOUND);
}

function createApiHandler({ authenticated = false, controller, methods }: ApiHandlerOptions) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!allowMethods(req, res, methods)) return;
    if (authenticated) return authenticate(req, res, () => runController(controller, req, res));
    return runController(controller, req, res);
  };
}

export { allowMethods, createApiHandler, methodNotAllowed, notFound, runController };
