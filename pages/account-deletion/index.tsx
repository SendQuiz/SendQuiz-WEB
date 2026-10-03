import Head from 'next/head';

const ACCOUNT_DELETION_URL = 'https://sendquiz.net/account-deletion/';

export default function AccountDeletionPage() {
  return (
    <>
      <Head>
        <title>계정 및 데이터 삭제 | 퀴즈 메이커 - 샌드</title>
        <meta
          name="description"
          content="퀴즈 메이커 - 샌드(com.send.quiz) SEND 계정 및 데이터 삭제 요청 방법입니다."
        />
        <link rel="canonical" href={ACCOUNT_DELETION_URL} />
      </Head>
      <main className="min-h-svh bg-[#f7f8fa] text-[#191f28]">
        <section className="border-b border-[#e5e8eb] bg-white px-5 pt-24 pb-12 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">
              Account deletion
            </p>
            <h1 className="mt-5 max-w-3xl text-[2.5rem] font-black leading-[1.08] tracking-normal text-[#111827] sm:text-[4rem]">
              퀴즈 메이커 - 샌드 계정 및 데이터 삭제
            </h1>
            <p className="mt-5 max-w-3xl text-[1.05rem]/8 font-medium text-[#4e5968]">
              이 페이지는 Google Play에 등록된 퀴즈 메이커 - 샌드(com.send.quiz) 앱과 SEND
              서비스의 계정 삭제 요청 방법을 안내합니다.
            </p>
          </div>
        </section>

        <section className="px-5 py-10 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <article className="rounded-lg border border-[#e5e8eb] bg-white p-6 shadow-[0_16px_44px_rgba(25,31,40,0.06)] sm:p-8">
              <section className="border-b border-[#eef0f3] pb-7">
                <h2 className="text-2xl font-black text-[#111827]">앱에서 삭제하기</h2>
                <ol className="mt-5 list-decimal space-y-3 pl-5 text-[16px]/8 font-medium text-[#333d4b]">
                  <li>퀴즈 메이커 - 샌드 앱을 엽니다.</li>
                  <li>설정에서 프로필 관리 화면으로 이동합니다.</li>
                  <li>회원 탈퇴를 선택한 뒤 확인하면 계정 삭제가 처리됩니다.</li>
                </ol>
              </section>

              <section className="border-b border-[#eef0f3] py-7">
                <h2 className="text-2xl font-black text-[#111827]">이메일로 요청하기</h2>
                <p className="mt-4 text-[16px]/8 font-medium text-[#333d4b]">
                  앱에 접근할 수 없거나 직접 삭제가 어려운 경우, 계정 이메일 주소를 포함해
                  <a className="font-bold text-[#1d4ed8] underline decoration-[#bfdbfe] underline-offset-4" href="mailto:contact@sendquiz.net">
                    {' '}contact@sendquiz.net
                  </a>
                  으로 계정 삭제를 요청해 주세요. 본인 확인 후 처리합니다.
                </p>
              </section>

              <section className="py-7">
                <h2 className="text-2xl font-black text-[#111827]">삭제되는 데이터</h2>
                <ul className="mt-5 list-disc space-y-3 pl-5 text-[16px]/8 font-medium text-[#333d4b]">
                  <li>계정 정보, 인증 정보, 닉네임, 이메일 인증 및 재설정 기록</li>
                  <li>계정에 연결된 퀴즈 채팅, 문제, 풀이 기록, 오답 기록</li>
                  <li>백업 데이터는 계정 삭제 후 30일 이내 순차적으로 삭제됩니다.</li>
                </ul>
                <p className="mt-5 text-[15px]/7 font-medium text-[#6b7684]">
                  법령 준수, 보안, 부정 이용 방지, 분쟁 대응에 필요한 일부 기록은 관련 법령과
                  개인정보처리방침에 따라 필요한 기간 동안 별도로 보관될 수 있습니다.
                </p>
              </section>
            </article>

            <aside className="rounded-lg border border-[#e5e8eb] bg-white p-5 shadow-[0_10px_30px_rgba(25,31,40,0.05)] lg:self-start">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#8b95a1]">
                Service details
              </h2>
              <dl className="mt-4 space-y-4 text-[14px]/6">
                <div>
                  <dt className="font-bold text-[#8b95a1]">앱 이름</dt>
                  <dd className="mt-1 font-black text-[#333d4b]">퀴즈 메이커 - 샌드</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b95a1]">서비스명</dt>
                  <dd className="mt-1 font-black text-[#333d4b]">SEND</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b95a1]">패키지명</dt>
                  <dd className="mt-1 font-black text-[#333d4b]">com.send.quiz</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b95a1]">운영자</dt>
                  <dd className="mt-1 font-black text-[#333d4b]">JIHYUK JUNG</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b95a1]">문의</dt>
                  <dd className="mt-1">
                    <a className="font-black text-[#1d4ed8] underline decoration-[#bfdbfe] underline-offset-4" href="mailto:contact@sendquiz.net">
                      contact@sendquiz.net
                    </a>
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
