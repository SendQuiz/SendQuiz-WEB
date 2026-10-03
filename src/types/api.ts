import type { JwtPayload } from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

type ApiNext = (error?: unknown) => void;

type ApiRequest = NextApiRequest & {
  params?: Record<string, string>;
  user?: JwtPayload;
};

type ApiResponse = NextApiResponse;
type ApiController<TRequest extends ApiRequest = ApiRequest> = (
  req: TRequest,
  res: ApiResponse,
  next: ApiNext,
) => unknown;

type RoutedApiRequest = ApiRequest & {
  params: Record<string, string>;
};

export type { ApiController, ApiNext, ApiRequest, ApiResponse, RoutedApiRequest };
