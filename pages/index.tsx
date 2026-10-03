import Head from 'next/head';
import Script from 'next/script';

const ASSET_BASE_URL = '/assets/landing/sandcastle';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.send.quiz';
const IOS_APP_STORE_URL = 'https://apps.apple.com/kr/app/%EC%83%8C%EB%93%9C-%ED%80%B4%EC%A6%88%EB%A5%BC-%EB%B3%B4%EB%82%B4%EB%8B%A4/id6758034904';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SEND</title>
        <meta
          name="description"
          content="SEND is a simple quiz and authentication service."
        />
      </Head>
      <main className="min-h-[100svh] bg-[#050505] text-white">
        <section className="relative min-h-[100svh] overflow-hidden">
          <picture className="absolute inset-0 block">
            <source
              media="(min-width: 1440px)"
              srcSet={`${ASSET_BASE_URL}/send-sandcastle-desktop-1920x1080.webp 1x, ${ASSET_BASE_URL}/send-sandcastle-desktop-2560x1440.webp 2x`}
              type="image/webp"
            />
            <source
              media="(min-width: 1024px)"
              srcSet={`${ASSET_BASE_URL}/send-sandcastle-desktop-1366x768.webp 1x, ${ASSET_BASE_URL}/send-sandcastle-desktop-1920x1080.webp 2x`}
              type="image/webp"
            />
            <source
              media="(min-width: 768px)"
              srcSet={`${ASSET_BASE_URL}/send-sandcastle-tablet-768x1024.webp 1x, ${ASSET_BASE_URL}/send-sandcastle-tablet-1536x2048.webp 2x`}
              type="image/webp"
            />
            <source
              media="(max-width: 767px)"
              srcSet={`${ASSET_BASE_URL}/send-sandcastle-mobile-390x844.webp 1x, ${ASSET_BASE_URL}/send-sandcastle-mobile-750x1624.webp 2x, ${ASSET_BASE_URL}/send-sandcastle-mobile-1080x1920.webp 3x`}
              type="image/webp"
            />
            <img
              src={`${ASSET_BASE_URL}/send-sandcastle-portrait-1080x1350.webp`}
              alt="SEND sandcastle scene"
              className="h-full min-h-[100svh] w-full object-cover"
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.22)_42%,rgba(0,0,0,0.68)_100%)]" />
          <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-12">
            <header className="flex items-center justify-between gap-6">
              <a className="text-xl font-semibold tracking-normal" href="/" aria-label="SEND home">
                SEND
              </a>
              <nav className="flex items-center gap-5 text-sm font-medium text-white/86">
                <a className="transition hover:text-white" href="/auth">
                  Login
                </a>
                <a className="transition hover:text-white" href="/policy/terms-of-service/">
                  Terms
                </a>
              </nav>
            </header>
            <div className="max-w-[620px] pb-8 sm:pb-12 lg:pb-16">
              <p className="mb-4 text-sm font-semibold uppercase text-white/72">
                Quiz service
              </p>
              <h1 className="max-w-[10ch] text-[3.75rem] font-semibold leading-[0.92] tracking-normal text-white sm:text-[5rem] lg:text-[6.5rem]">
                SEND
              </h1>
              <p className="mt-6 max-w-[34rem] text-base leading-7 text-white/82 sm:text-lg">
                A focused quiz experience for creating, signing in, and continuing your learning flow.
              </p>
              <a
                className="mt-7 inline-flex min-h-11 min-w-36 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#07111f] shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition hover:bg-white/92"
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener"
                data-mobile-app-download
                data-ios-url={IOS_APP_STORE_URL}
                data-android-url={GOOGLE_PLAY_URL}
              >
                앱 다운로드
              </a>
            </div>
          </div>
        </section>
        <footer className="border-t border-white/10 bg-[#080808]/95 px-6 py-10 text-[13px] leading-7 text-white/52 sm:px-10 lg:px-14" aria-label="사이트 푸터">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-7">
            <nav className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4" aria-label="사이트 주요 정보">
              <section className="flex flex-col gap-3">
                <h2 className="text-[13px] font-semibold leading-none text-white/82">서비스</h2>
                <ul className="flex list-none flex-col gap-2 p-0 m-0">
                  <li>
                    <a className="transition hover:text-white" href="/">
                      홈
                    </a>
                  </li>
                  <li>
                    <a className="transition hover:text-white" href="/auth">
                      로그인
                    </a>
                  </li>
                </ul>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-[13px] font-semibold leading-none text-white/82">정보</h2>
                <ul className="flex list-none flex-col gap-2 p-0 m-0">
                  <li>
                    <a className="transition hover:text-white" href="/policy/terms-of-service/">
                      이용약관
                    </a>
                  </li>
                  <li>
                    <a className="font-semibold text-white/82 transition hover:text-white" href="/policy/privacy-policy/">
                      개인정보처리방침
                    </a>
                  </li>
                </ul>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-[13px] font-semibold leading-none text-white/82">지원</h2>
                <ul className="flex list-none flex-col gap-2 p-0 m-0">
                  <li>
                    <a className="transition hover:text-white" href="/support/">
                      고객센터
                    </a>
                  </li>
                  <li>
                    <a className="transition hover:text-white" href="/account-deletion/">
                      계정 삭제
                    </a>
                  </li>
                  <li>
                    <a className="transition hover:text-white" href="mailto:contact@sendquiz.net">
                      contact@sendquiz.net
                    </a>
                  </li>
                </ul>
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="text-[13px] font-semibold leading-none text-white/82">앱</h2>
                <ul className="flex list-none flex-col gap-2 p-0 m-0">
                  <li>
                    <a className="transition hover:text-white" href="/app-ads.txt">
                      app-ads.txt
                    </a>
                  </li>
                  <li>
                    <a className="transition hover:text-white" href="/ads.txt">
                      ads.txt
                    </a>
                  </li>
                </ul>
              </section>
            </nav>
            <div className="border-t border-white/10 pt-5">
              <p className="font-semibold text-white/62">SEND</p>
              <p className="mt-1 text-xs leading-6 text-white/36">
                개인 운영 앱 및 웹 서비스 · 호스팅 서비스 제공자: Oracle Cloud Infrastructure
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/36">
              <div className="flex items-center gap-4">
                <a className="transition hover:text-white" href="/policy/terms-of-service/">
                  이용약관
                </a>
                <a className="font-semibold text-white/82 transition hover:text-white" href="/policy/privacy-policy/">
                  개인정보처리방침
                </a>
                <a className="transition hover:text-white" href="/account-deletion/">
                  계정 삭제
                </a>
              </div>
              <p>© 2026 SEND. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
      <Script id="send-mobile-app-download-link" strategy="afterInteractive">
        {`
          (() => {
            const link = document.querySelector('[data-mobile-app-download]');
            if (!link) return;

            const userAgent = window.navigator.userAgent || '';
            const platform = window.navigator.platform || '';
            const isAndroid = /Android/i.test(userAgent);
            const isIos = /iPhone|iPad|iPod/i.test(userAgent)
              || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

            if (isIos && link.dataset.iosUrl) {
              link.href = link.dataset.iosUrl;
              return;
            }

            if (isAndroid && link.dataset.androidUrl) {
              link.href = link.dataset.androidUrl;
            }
          })();
        `}
      </Script>
    </>
  );
}
