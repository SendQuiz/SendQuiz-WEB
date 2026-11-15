'use client';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.send.quiz';
const IOS_URL = 'https://apps.apple.com/kr/app/%EC%83%8C%EB%93%9C-%ED%80%B4%EC%A6%88%EB%A5%BC-%EB%B3%B4%EB%82%B4%EB%8B%A4/id6758034904';

export default function AppDownloadLink() {
  return <a className="mt-7 inline-flex min-h-11 min-w-36 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#07111f] shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition hover:bg-white/92" href={ANDROID_URL} onClick={(event) => {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) event.currentTarget.href = IOS_URL;
  }} target="_blank" rel="noopener">앱 다운로드</a>;
}
