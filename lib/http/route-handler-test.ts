import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routeHandler } from '@/lib/http/route-handler';
import { authenticate } from '@/lib/auth/token';
import { readBodyArray } from '@/lib/http/request';

vi.mock('@/lib/auth/token', () => ({ authenticate: vi.fn() }));
const context = { params: Promise.resolve({ provider: 'apple' }) };

beforeEach(() => vi.clearAllMocks());

describe('App Router request boundary', () => {
  it('keeps JSON arrays intact and separates route params from the query', async () => {
    const handler = routeHandler(async (req) => Response.json({ messages: readBodyArray(req, 'messages'), provider: req.params.provider, query: req.query.get('provider') }));
    const response = await handler(new Request('http://localhost/api?provider=google', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ text: 'question' }, { text: 'answer' }] }),
    }), context);
    expect(await response.json()).toEqual({ messages: [{ text: 'question' }, { text: 'answer' }], provider: 'apple', query: 'google' });
  });

  it('parses Apple OAuth form callbacks', async () => {
    const handler = routeHandler(async (req) => Response.json(req.body));
    const response = await handler(new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'code=a%2Bb&state=xyz' }), context);
    expect(await response.json()).toEqual({ code: 'a+b', state: 'xyz' });
  });

  it.each(['{', 'null', '[]'])('rejects invalid JSON bodies: %s', async (body) => {
    const action = vi.fn();
    const response = await routeHandler(action)(new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }), context);
    expect(response.status).toBe(400);
    expect(action).not.toHaveBeenCalled();
  });

  it('stops unauthorized requests before invoking the handler', async () => {
    vi.mocked(authenticate).mockRejectedValue(Response.json({ message: 'UNAUTHORIZED' }, { status: 401 }));
    const action = vi.fn();
    const response = await routeHandler(action, { authenticated: true })(new Request('http://localhost/api'), context);
    expect(response.status).toBe(401);
    expect(action).not.toHaveBeenCalled();
  });

  it('returns validation failures without replacing their status or body', async () => {
    const response = await routeHandler(async () => { throw Response.json({ message: 'REQUIRED' }, { status: 400 }); })(new Request('http://localhost/api'), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'REQUIRED' });
  });
});
