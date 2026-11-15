import Link from 'next/link';

export default function NotFound() {
  return <main className="flex min-h-svh flex-col items-center justify-center gap-6"><h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다.</h1><Link href="/">홈으로 돌아가기</Link></main>;
}
