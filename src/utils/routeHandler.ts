import { authenticate } from './auth';
import { getHttpStatus } from './httpError';
import { API_MESSAGES } from './messages';
import type { RequestContext } from '../types/api';

type Context = { params: Promise<Record<string, string>> };

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  const text = await request.text();
  if (!text) return {};
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  if (contentType === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(text));
  if (contentType !== 'application/json') throw Response.json({ message: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415 });
  try {
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
    return body as Record<string, unknown>;
  } catch {
    throw Response.json({ message: 'INVALID_JSON' }, { status: 400 });
  }
}

export function routeHandler(handler: (context: RequestContext) => Promise<Response>, { authenticated = false } = {}) {
  return async (request: Request, context: Context): Promise<Response> => {
    try {
      const user = authenticated ? await authenticate(request.headers) : undefined;
      return await handler({
        method: request.method,
        headers: request.headers,
        body: await readBody(request),
        query: new URL(request.url).searchParams,
        params: await context.params,
        user,
      });
    } catch (error) {
      if (error instanceof Response) return error;
      const status = getHttpStatus(error);
      console.error('API_ERROR', { method: request.method, path: new URL(request.url).pathname, status, error });
      return Response.json(API_MESSAGES.INTERNAL_SERVER_ERROR, { status });
    }
  };
}

export function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } });
}
