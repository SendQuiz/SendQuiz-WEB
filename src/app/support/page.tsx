import type { Metadata } from 'next';
import SupportForm from './support-form';

export const metadata: Metadata = { title: '고객센터', alternates: { canonical: '/support' } };

export default function SupportPage() {
  return <main className="min-h-svh bg-[#f6f6f7] px-5 py-16 text-[#1f2933]">
    <section className="mx-auto max-w-[680px] rounded-2xl bg-white p-8 shadow-xl">
      <h1 className="mb-3 text-[28px] font-bold">고객센터 지원문의</h1>
      <p className="mb-5 text-[#52606d]">문의 내용을 남겨주시면 빠르게 확인하고 안내드리겠습니다.</p>
      <SupportForm />
    </section>
  </main>;
}
