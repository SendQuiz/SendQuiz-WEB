import { FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';

import { buildOAuthStartPath, type Mode } from '../utils/authClient';

const AUTH_FIELD_CLASS =
  'h-[52px] w-full rounded-full border border-[#303030] bg-black px-5 text-base text-white outline-none placeholder:text-white/45 focus:border-[#5f5f5f] focus:bg-[#101010]';
const AUTH_PRIMARY_BUTTON_CLASS =
  'h-[52px] w-full rounded-full bg-white text-base font-medium text-[#0d0d0d] disabled:opacity-70';
const AUTH_LINK_CLASS = 'text-sm font-medium text-white/70 no-underline';

type AuthPathBuilder = (targetMode: Mode, extra?: Record<string, string>) => string;

type AuthFormProps = {
  isSubmitting: boolean;
};

type BackToLoginProps = {
  authPath: AuthPathBuilder;
};

type LoginFormProps = AuthFormProps & BackToLoginProps & {
  isMobileWebView: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type AuthHandlers = {
  changePassword: (event: FormEvent<HTMLFormElement>) => void;
  forgotPassword: (event: FormEvent<HTMLFormElement>) => void;
  login: (event: FormEvent<HTMLFormElement>) => void;
  resetPassword: (event: FormEvent<HTMLFormElement>) => void;
  signup: (event: FormEvent<HTMLFormElement>) => void;
  verifyEmail: (event: FormEvent<HTMLFormElement>) => void;
};

function GoogleLogoIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-none" viewBox="0 0 20 20">
      <path
        d="M19.6 10.2273C19.6 9.5182 19.5364 8.8364 19.4182 8.1818H10V12.05H15.3818C15.15 13.3 14.4455 14.3591 13.3864 15.0682V17.5773H16.6182C18.5091 15.8364 19.6 13.2727 19.6 10.2273Z"
        fill="#4285F4"
      />
      <path
        d="M10 20C12.7 20 14.9636 19.1045 16.6181 17.5773L13.3863 15.0682C12.4909 15.6682 11.3454 16.0227 10 16.0227C7.3954 16.0227 5.1909 14.2636 4.4045 11.9H1.0636V14.4909C2.7091 17.7591 6.0909 20 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.4045 11.9C4.2045 11.3 4.0909 10.6591 4.0909 10C4.0909 9.3409 4.2045 8.7 4.4045 8.1V5.5091H1.0636C0.3864 6.8591 0 8.3864 0 10C0 11.6136 0.3864 13.1409 1.0636 14.4909L4.4045 11.9Z"
        fill="#FBBC04"
      />
      <path
        d="M10 3.9773C11.4681 3.9773 12.7863 4.4818 13.8227 5.4727L16.6909 2.6045C14.9591 0.9909 12.6954 0 10 0C6.0909 0 2.7091 2.2409 1.0636 5.5091L4.4045 8.1C5.1909 5.7364 7.3954 3.9773 10 3.9773Z"
        fill="#E94235"
      />
    </svg>
  );
}

function AppleLogoIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-none" viewBox="0 0 17 20">
      <path
        d="M13.7 10.6c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.1-1.7-1.3-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4 0 0-2.4-.9-2.4-3.4ZM11.5 4.3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1 1.7-.9 2.6 1 .1 1.9-.5 2.5-1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SocialAuthButtons({ isMobileWebView }: { isMobileWebView: boolean }) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-3">
        <a
          className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#303030] bg-black text-base font-medium leading-6 text-white no-underline"
          href={buildOAuthStartPath('google', isMobileWebView)}
        >
          <GoogleLogoIcon />
          <span>Google 계정으로 계속하기</span>
        </a>
        <a
          className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#303030] bg-black text-base font-medium leading-6 text-white no-underline"
          href={buildOAuthStartPath('apple', isMobileWebView)}
        >
          <AppleLogoIcon />
          <span>Apple 계정으로 계속하기</span>
        </a>
      </div>
      <div className="mb-5 flex items-center gap-6 text-base font-normal text-white/70 before:h-px before:flex-1 before:bg-[#303030] before:content-[''] after:h-px after:flex-1 after:bg-[#303030] after:content-['']">
        <span>또는</span>
      </div>
    </>
  );
}

function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={AUTH_FIELD_CLASS} required {...props} />;
}

function AuthNav({ children, align = 'between' }: { align?: 'between' | 'start'; children: ReactNode }) {
  return (
    <nav className={`mt-[18px] flex items-center gap-4 ${align === 'start' ? 'justify-start' : 'justify-between'}`}>
      {children}
    </nav>
  );
}

function LoginLink({ href, children = '로그인으로 돌아가기' }: { children?: string; href: string }) {
  return <a className={AUTH_LINK_CLASS} href={href}>{children}</a>;
}

function LoginForm({ authPath, isMobileWebView, isSubmitting, onSubmit }: LoginFormProps) {
  return (
    <>
      <SocialAuthButtons isMobileWebView={isMobileWebView} />
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <AuthInput autoComplete="email" name="email" placeholder="이메일" type="email" />
        <AuthInput autoComplete="current-password" name="password" placeholder="비밀번호" type="password" />
        <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">로그인</button>
      </form>
      <AuthNav>
        <a className={AUTH_LINK_CLASS} href={authPath('signup')}>회원가입</a>
        <a className={AUTH_LINK_CLASS} href={authPath('forgot-password')}>비밀번호 찾기</a>
      </AuthNav>
    </>
  );
}

function BackToLogin({ authPath }: BackToLoginProps) {
  return (
    <AuthNav>
      <LoginLink href={authPath('login')} />
    </AuthNav>
  );
}

function SignupForm({
  authPath,
  isMobileWebView,
  isSubmitting,
  onSubmit,
}: AuthFormProps & BackToLoginProps & {
  isMobileWebView: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <SocialAuthButtons isMobileWebView={isMobileWebView} />
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <AuthInput autoComplete="email" name="email" placeholder="이메일" type="email" />
        <AuthInput autoComplete="nickname" name="nickname" placeholder="닉네임" />
        <AuthInput autoComplete="new-password" minLength={8} name="password" placeholder="비밀번호" type="password" />
        <AuthInput autoComplete="new-password" minLength={8} name="passwordConfirm" placeholder="비밀번호 확인" type="password" />
        <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">회원가입</button>
      </form>
      <BackToLogin authPath={authPath} />
    </>
  );
}

function VerifyEmailForm({
  authPath,
  initialCode,
  initialEmail,
  isSubmitting,
  onSubmit,
}: AuthFormProps & BackToLoginProps & {
  initialCode: string;
  initialEmail: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <AuthInput autoComplete="email" defaultValue={initialEmail} name="email" placeholder="가입 이메일" type="email" />
        <AuthInput autoComplete="one-time-code" defaultValue={initialCode} name="code" placeholder="인증 코드" />
        <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">이메일 인증</button>
      </form>
      <BackToLogin authPath={authPath} />
    </>
  );
}

function ForgotPasswordForm({
  authPath,
  isSubmitting,
  onSubmit,
}: AuthFormProps & BackToLoginProps & {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <AuthInput autoComplete="email" name="email" placeholder="가입 이메일" type="email" />
        <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">인증 코드 받기</button>
      </form>
      <BackToLogin authPath={authPath} />
    </>
  );
}

function ResetPasswordForm({
  initialCode,
  initialEmail,
  isSubmitting,
  onSubmit,
}: AuthFormProps & {
  initialCode: string;
  initialEmail: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <AuthInput autoComplete="email" defaultValue={initialEmail} name="email" placeholder="가입 이메일" type="email" />
      <AuthInput autoComplete="one-time-code" defaultValue={initialCode} name="code" placeholder="인증 코드" />
      <AuthInput autoComplete="new-password" minLength={8} name="newPassword" placeholder="새 비밀번호" type="password" />
      <AuthInput autoComplete="new-password" minLength={8} name="passwordConfirm" placeholder="새 비밀번호 확인" type="password" />
      <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">비밀번호 재설정</button>
    </form>
  );
}

function ChangePasswordForm({
  authPath,
  hasSession,
  isSubmitting,
  onSubmit,
}: AuthFormProps & BackToLoginProps & {
  hasSession: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!hasSession) {
    return (
      <AuthNav align="start">
        <LoginLink href={authPath('login')}>로그인이 필요합니다</LoginLink>
      </AuthNav>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <AuthInput autoComplete="current-password" name="currentPassword" placeholder="현재 비밀번호" type="password" />
      <AuthInput autoComplete="new-password" minLength={8} name="newPassword" placeholder="새 비밀번호" type="password" />
      <AuthInput autoComplete="new-password" minLength={8} name="passwordConfirm" placeholder="새 비밀번호 확인" type="password" />
      <button className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isSubmitting} type="submit">비밀번호 변경</button>
    </form>
  );
}

function AuthModePanel({
  authPath,
  hasSession,
  handlers,
  initialCode,
  initialEmail,
  isMobileWebView,
  isSubmitting,
  mode,
}: AuthFormProps & BackToLoginProps & {
  hasSession: boolean;
  handlers: AuthHandlers;
  initialCode: string;
  initialEmail: string;
  isMobileWebView: boolean;
  mode: Mode;
}) {
  if (mode === 'login') {
    return (
      <LoginForm
        authPath={authPath}
        isMobileWebView={isMobileWebView}
        isSubmitting={isSubmitting}
        onSubmit={handlers.login}
      />
    );
  }

  if (mode === 'signup') {
    return (
      <SignupForm
        authPath={authPath}
        isMobileWebView={isMobileWebView}
        isSubmitting={isSubmitting}
        onSubmit={handlers.signup}
      />
    );
  }

  if (mode === 'verify-email') {
    return (
      <VerifyEmailForm
        authPath={authPath}
        initialCode={initialCode}
        initialEmail={initialEmail}
        isSubmitting={isSubmitting}
        onSubmit={handlers.verifyEmail}
      />
    );
  }

  if (mode === 'forgot-password') {
    return (
      <ForgotPasswordForm
        authPath={authPath}
        isSubmitting={isSubmitting}
        onSubmit={handlers.forgotPassword}
      />
    );
  }

  if (mode === 'reset-password') {
    return (
      <ResetPasswordForm
        initialCode={initialCode}
        initialEmail={initialEmail}
        isSubmitting={isSubmitting}
        onSubmit={handlers.resetPassword}
      />
    );
  }

  return (
    <ChangePasswordForm
      authPath={authPath}
      hasSession={hasSession}
      isSubmitting={isSubmitting}
      onSubmit={handlers.changePassword}
    />
  );
}

export { AuthModePanel };
