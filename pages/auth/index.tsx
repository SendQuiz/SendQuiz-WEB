import { FormEvent, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AuthModePanel, type AuthHandlers } from '../../src/components/authForms';
import {
  MOBILE_WEBVIEW,
  SESSION_KEY,
  buildAuthPath,
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
  type AuthSession,
  type Mode,
} from '../../src/utils/authClient';

export default function AuthPage() {
  const router = useRouter();
  const mode = normalizeMode(router.query.mode);
  const isMobileWebView = router.query.webview === MOBILE_WEBVIEW;
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const title = getAuthTitle(mode);
  const webview = isMobileWebView ? MOBILE_WEBVIEW : '';
  const authPath = (targetMode: Mode, extra: Record<string, string> = {}) => buildAuthPath(targetMode, { ...extra, webview });
  const initialCode = String(router.query.code || '');
  const initialEmail = String(router.query.email || '');

  useEffect(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    if (router.query.oauth === 'failed') setMessage('소셜 로그인에 실패했습니다. 다시 시도해 주세요.');
  }, [router.query.oauth]);

  async function submit(action: () => Promise<void>) {
    setIsSubmitting(true);
    setMessage('');
    setDevCode('');
    try {
      await action();
    } catch (error) {
      setMessage(errorMessageFor(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function submitForm(
    action: (formData: FormData) => Promise<void>,
    validate?: (formData: FormData) => boolean
  ) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      if (validate && !validate(formData)) return;

      void submit(() => action(formData));
    };
  }

  function passwordsMatch(formData: FormData, passwordKey: string) {
    if (formFieldsMatch(formData, passwordKey, 'passwordConfirm')) return true;

    setMessage('비밀번호가 일치하지 않습니다.');
    return false;
  }

  const handlers: AuthHandlers = {
    login: submitForm(async (formData) => {
      const auth = await postJson<AuthSession>('/api/auth/login', {
        email: readFormString(formData, 'email'),
        password: readFormString(formData, 'password'),
      });
      saveSession(auth);
      postMobileMessage({ type: SESSION_KEY, session: auth });
      setMessage('로그인되었습니다.');
    }),
    signup: submitForm(async (formData) => {
      const result = await postJson<{ email?: string; verificationCode?: string }>('/api/auth/register', {
        email: readFormString(formData, 'email'),
        nickname: readFormString(formData, 'nickname'),
        password: readFormString(formData, 'password'),
      });
      if (result.verificationCode) setDevCode(result.verificationCode);
      await router.push(authPath('verify-email', {
        code: result.verificationCode || '',
        email: result.email || readFormString(formData, 'email'),
      }));
    }, (formData) => passwordsMatch(formData, 'password')),
    verifyEmail: submitForm(async (formData) => {
      const auth = await postJson<AuthSession>('/api/auth/verify-email/confirm', {
        email: readFormString(formData, 'email'),
        code: readFormString(formData, 'code'),
      });
      saveSession(auth);
      postMobileMessage({ type: SESSION_KEY, session: auth });
      setMessage('인증되었습니다.');
    }),
    forgotPassword: submitForm(async (formData) => {
      const email = readFormString(formData, 'email');
      const result = await postJson<{ resetCode?: string }>('/api/auth/forgot-password/request', { email });
      if (result.resetCode) setDevCode(result.resetCode);
      await router.push(authPath('reset-password', {
        code: result.resetCode || '',
        email,
      }));
    }),
    resetPassword: submitForm(async (formData) => {
      await postJson('/api/auth/forgot-password/confirm', {
        email: readFormString(formData, 'email'),
        code: readFormString(formData, 'code'),
        newPassword: readFormString(formData, 'newPassword'),
      });
      await router.push(authPath('login'));
    }, (formData) => passwordsMatch(formData, 'newPassword')),
    changePassword: submitForm(async (formData) => {
      const token = session?.token || '';
      await postJson('/api/profile/password', {
        currentPassword: readFormString(formData, 'currentPassword'),
        newPassword: readFormString(formData, 'newPassword'),
      }, token);
      clearSession();
      postMobileMessage({ type: SESSION_KEY, action: 'passwordChanged' });
      setMessage('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
    }, (formData) => passwordsMatch(formData, 'newPassword')),
  };

  return (
    <>
      <Head>
        <title>{`${title} | SEND`}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-black px-5 py-8 pb-16">
        <section className="mx-auto w-full max-w-[440px] px-6 pb-10 text-white">
          <h1 className="mb-5 text-center text-3xl font-normal leading-tight text-white">{title}</h1>
          {message ? <p className="mb-3.5 rounded-2xl border border-[#303030] bg-[#101010] px-4 py-3 text-sm font-medium leading-relaxed text-white/85">{message}</p> : null}
          {devCode ? <p className="mb-3.5 rounded-2xl border border-[#303030] bg-[#101010] px-4 py-3 text-sm font-medium leading-relaxed text-white/85">개발용 인증 코드: {devCode}</p> : null}
          <AuthModePanel
            authPath={authPath}
            hasSession={Boolean(session?.token)}
            handlers={handlers}
            initialCode={initialCode}
            initialEmail={initialEmail}
            isMobileWebView={isMobileWebView}
            isSubmitting={isSubmitting}
            mode={mode}
          />
        </section>
      </main>
    </>
  );
}
