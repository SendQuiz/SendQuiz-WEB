import type { JwtPayload } from 'jsonwebtoken';

export type RequestContext = {
  method: string;
  headers: Headers;
  body: Record<string, unknown>;
  query: URLSearchParams;
  params: Record<string, string>;
  user?: JwtPayload;
};
