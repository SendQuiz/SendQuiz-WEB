import { redirect } from "@/lib/http/route-handler";
import {
  normalizeProvider,
} from "@/lib/auth/oauth";
import { requireBodyString } from "@/lib/http/guards";
import {
  consumeWebOAuthRequest,
  createMobileOAuthReturnUrl,
  exchangeMobileOAuthCode,
  resolveOAuthUser,
  startWebOAuthRequest,
} from "@/lib/auth/oauth-service";
import { serializeAuthSession } from "@/lib/auth/session";
import { createOAuthCallbackHtml } from "@/lib/auth/callback-html";
import { API_MESSAGES } from "@/lib/http/messages";
import { readBodyString, readQueryString } from "@/lib/http/request";
import type { RequestContext } from "@/lib/http/types";

function readCallbackPayload(req: RequestContext) {
  if (req.method === "POST") {
    return {
      code: readBodyString(req, "code", { trim: false }),
      error: readBodyString(req, "error", { trim: false }),
      state: readBodyString(req, "state", { trim: false }),
    };
  }

  return {
    code: readQueryString(req, "code", { trim: false }),
    error: readQueryString(req, "error", { trim: false }),
    state: readQueryString(req, "state", { trim: false }),
  };
}

async function startWebOAuth(req: RequestContext) {
  const provider = normalizeProvider(req.params.provider);
  if (!provider) return Response.json(API_MESSAGES.UNSUPPORTED_OAUTH_PROVIDER, { status: 400 });

  const authorizationUrl = await startWebOAuthRequest({
    mobileReturnUri: readQueryString(req, "mobile_return_uri"),
    provider,
    redirectPath: readQueryString(req, "redirect"),
  });

  return redirect(authorizationUrl);
}

async function completeWebOAuth(req: RequestContext) {
  try {
    const provider = normalizeProvider(req.params.provider);
    if (!provider) return Response.json(API_MESSAGES.UNSUPPORTED_OAUTH_PROVIDER, { status: 400 });

    const payload = readCallbackPayload(req);
    if (payload.error || !payload.code || !payload.state) return redirect("/auth?mode=login&oauth=failed");

    const authRequest = await consumeWebOAuthRequest(provider, payload.state);
    if (!authRequest) return redirect("/auth?mode=login&oauth=failed");

    const user = await resolveOAuthUser({
      code: payload.code,
      expectedNonceHash: authRequest.NONCE_HASH,
      provider,
      redirectUri: authRequest.REDIRECT_URI,
    });

    if (authRequest.MOBILE_RETURN_URI) {
      const returnUrl = await createMobileOAuthReturnUrl({
        provider,
        returnUri: authRequest.MOBILE_RETURN_URI,
        userId: user.ID,
      });
      return redirect(returnUrl);
    }

    return new Response(createOAuthCallbackHtml(serializeAuthSession(user), authRequest.REDIRECT_PATH), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return redirect("/auth?mode=login&oauth=failed");
  }
}

async function exchangeMobileOAuth(req: RequestContext) {
  const code = requireBodyString(req, "code", API_MESSAGES.OAUTH_CODE_REQUIRED);

  const user = await exchangeMobileOAuthCode(code);
  if (!user) return Response.json(API_MESSAGES.INVALID_OAUTH_CODE, { status: 401 });

  return Response.json({ ...API_MESSAGES.OK, ...serializeAuthSession(user) });
}

export { completeWebOAuth, exchangeMobileOAuth, startWebOAuth };
