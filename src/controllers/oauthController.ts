import {
  normalizeProvider,
} from "../utils/oauth";
import { requireBodyString } from "./guards";
import {
  consumeWebOAuthRequest,
  createMobileOAuthReturnUrl,
  exchangeMobileOAuthCode,
  resolveOAuthUser,
  startWebOAuthRequest,
} from "../services/oauthService";
import { serializeAuthSession } from "../utils/authSession";
import { createOAuthCallbackHtml } from "../utils/oauthCallbackHtml";
import { API_MESSAGES } from "../utils/messages";
import { readBodyString, readQueryString } from "../utils/request";
import type { ApiNext, ApiRequest, ApiResponse } from "../types/api";

type OAuthProvider = "apple" | "google";

function readCallbackPayload(req: ApiRequest) {
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

async function startWebOAuth(req: ApiRequest, res: ApiResponse) {
  const provider = normalizeProvider(readQueryString(req, "provider"));
  if (!provider) return res.status(400).json(API_MESSAGES.UNSUPPORTED_OAUTH_PROVIDER);

  const authorizationUrl = await startWebOAuthRequest({
    mobileReturnUri: readQueryString(req, "mobile_return_uri"),
    provider,
    redirectPath: readQueryString(req, "redirect"),
  });

  return res.redirect(302, authorizationUrl);
}

async function completeWebOAuth(req: ApiRequest, res: ApiResponse, next: ApiNext) {
  try {
    const provider = normalizeProvider(readQueryString(req, "provider"));
    if (!provider) return res.status(400).json(API_MESSAGES.UNSUPPORTED_OAUTH_PROVIDER);

    const payload = readCallbackPayload(req);
    if (payload.error || !payload.code || !payload.state) return res.redirect(302, "/auth?mode=login&oauth=failed");

    const authRequest = await consumeWebOAuthRequest(provider, payload.state);
    if (!authRequest) return res.redirect(302, "/auth?mode=login&oauth=failed");

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
      return res.redirect(302, returnUrl);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(createOAuthCallbackHtml(serializeAuthSession(user), authRequest.REDIRECT_PATH));
  } catch (error) {
    if (res.writableEnded) return;
    return res.redirect(302, "/auth?mode=login&oauth=failed");
  }
}

async function exchangeMobileOAuth(req: ApiRequest, res: ApiResponse) {
  const code = requireBodyString(req, res, "code", API_MESSAGES.OAUTH_CODE_REQUIRED);
  if (!code) return;

  const user = await exchangeMobileOAuthCode(code);
  if (!user) return res.status(401).json(API_MESSAGES.INVALID_OAUTH_CODE);

  return res.json({ ...API_MESSAGES.OK, ...serializeAuthSession(user) });
}

export { completeWebOAuth, exchangeMobileOAuth, startWebOAuth };
