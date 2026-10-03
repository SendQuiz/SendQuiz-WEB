export type Mode = 'change-password' | 'forgot-password' | 'login' | 'reset-password' | 'signup' | 'verify-email';

export type AuthSession = {
  token: string;
  user?: {
    EMAIL?: string | null;
    ID?: number;
    NICKNAME?: string | null;
  };
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

const SESSION_KEY = 'send.authSession';
const MOBILE_WEBVIEW = 'mobile';
const AUTH_TITLES: Record<Mode, string> = {
  'change-password': '비밀번호 변경',
  'forgot-password': '비밀번호 찾기',
  login: '로그인',
  'reset-password': '비밀번호 재설정',
  signup: '회원가입',
  'verify-email': '이메일 인증',
};

function normalizeMode(value: unknown): Mode {
  const mode = String(value || 'login');
  if (
    mode === 'change-password' ||
    mode === 'forgot-password' ||
    mode === 'reset-password' ||
    mode === 'signup' ||
    mode === 'verify-email'
  ) return mode;
  return 'login';
}

function getAuthTitle(mode: Mode) {
  return AUTH_TITLES[mode];
}

async function postJson<T>(path: string, body: Record<string, unknown>, token = '') {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || 'REQUEST_FAILED');
  return payload as T;
}

function errorMessageFor(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'PASSWORD_TOO_SHORT') return '비밀번호는 8자 이상 입력해 주세요.';
  if (message === 'EMAIL_ALREADY_EXISTS') return '이미 가입된 이메일입니다.';
  if (message === 'EMAIL_REQUIRED') return '이메일을 입력해 주세요.';
  if (message === 'PASSWORD_REQUIRED') return '비밀번호를 입력해 주세요.';
  if (message === 'NICKNAME_REQUIRED') return '닉네임을 입력해 주세요.';
  if (message === 'PASSWORD_LOGIN_NOT_AVAILABLE') return '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.';
  if (message === 'RATE_LIMITED') return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  return message || '요청을 처리할 수 없습니다.';
}

function buildAuthPath(mode: Mode, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ mode });
  if (extra.webview) params.set('webview', extra.webview);
  if (extra.email) params.set('email', extra.email);
  if (extra.code) params.set('code', extra.code);
  return `/auth?${params.toString()}`;
}

function buildOAuthStartPath(provider: 'apple' | 'google', isMobileWebView: boolean) {
  const params = new URLSearchParams({ redirect: '/auth?mode=login' });
  if (isMobileWebView) params.set('mobile_return_uri', 'send://auth/oauth');
  return `/api/auth/oauth/web/${provider}/start?${params.toString()}`;
}

function readFormString(formData: FormData, key: string) {
  return String(formData.get(key) || '');
}

function formFieldsMatch(formData: FormData, leftKey: string, rightKey: string) {
  return readFormString(formData, leftKey) === readFormString(formData, rightKey);
}

function saveSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.token === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function postMobileMessage(message: Record<string, unknown>) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

export {
  MOBILE_WEBVIEW,
  SESSION_KEY,
  buildAuthPath,
  buildOAuthStartPath,
  clearSession,
  errorMessageFor,
  formFieldsMatch,
  getAuthTitle,
  normalizeMode,
  postJson,
  postMobileMessage,
  readFormString,
  readSession,
  saveSession,
};
