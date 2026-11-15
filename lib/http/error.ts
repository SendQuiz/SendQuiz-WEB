type HttpError = Error & {
  statusCode: number;
};

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function getHttpStatus(error: unknown, fallback = 500) {
  if (error instanceof Error && "statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  return fallback;
}

export { createHttpError, getHttpStatus, type HttpError };
