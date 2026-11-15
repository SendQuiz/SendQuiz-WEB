'use client';

import { useState, type FormEvent } from 'react';

export default function SupportForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get('message') || '').trim();
    if (!message) { setFailed(true); setStatus('메시지를 입력해 주세요.'); return; }
    setPending(true);
    setFailed(false);
    setStatus('전송 중입니다...');
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      if (!response.ok) throw new Error('전송에 실패했습니다. 다시 시도해 주세요.');
      form.reset();
      setStatus('문의가 접수되었습니다. 감사합니다.');
    } catch (error) {
      setFailed(true);
      setStatus(error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.');
    } finally { setPending(false); }
  }

  return <form onSubmit={submit}>
    <label className="mb-2 block font-semibold" htmlFor="message">문의 내용</label>
    <textarea className="min-h-40 w-full resize-y rounded-xl border border-[#d9e2ec] px-3.5 py-3 text-[15px]" id="message" name="message" placeholder="문의하실 내용을 입력해 주세요." required />
    <div className="mt-4 flex justify-end"><button className="rounded-full bg-[#1f7aec] px-5 py-2.5 font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">제출</button></div>
    <p className={`mt-4 text-sm ${failed ? 'text-[#d64545]' : 'text-[#12805c]'}`} role="status" aria-live="polite">{status}</p>
  </form>;
}
