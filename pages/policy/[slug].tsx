import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import type { ReactNode } from 'react';
import {
  getPolicyDocumentBySlug,
  getPolicyStaticPaths,
  type PolicyBlock,
  type PolicyDocument,
  type PolicyDocumentMeta,
  type PolicyHeadingBlock,
} from '../../src/models/policyDocuments';

type PolicyPageProps = {
  document: PolicyDocument;
};

const documentLabels = {
  privacy: {
    eyebrow: 'Privacy and data processing',
    icon: <ShieldIcon />,
    switchLabel: '서비스 이용약관',
    switchSegment: 'terms-of-service',
  },
  terms: {
    eyebrow: 'Service rules and content terms',
    icon: <FileIcon />,
    switchLabel: '개인정보 처리방침',
    switchSegment: 'privacy-policy',
  },
} as const;

export const getStaticPaths: GetStaticPaths = async () => ({
  fallback: false,
  paths: getPolicyStaticPaths(),
});

export const getStaticProps: GetStaticProps<PolicyPageProps> = async ({ params }) => {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const document = getPolicyDocumentBySlug(slug);

  if (!document) {
    return { notFound: true };
  }

  return { props: { document } };
};

export default function PolicyPage({ document }: PolicyPageProps) {
  const labels = documentLabels[document.kind];

  return (
    <>
      <Head>
        <title>{document.title} | SEND</title>
        <meta name="description" content={document.description} />
      </Head>
      <main className="min-h-svh bg-[#f7f8fa] text-[#191f28]">
        <section className="border-b border-[#e5e8eb] bg-white px-5 pt-28 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-312 gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-[13px] font-bold uppercase tracking-[0.12em] text-[#1d4ed8]">
                {labels.icon}
                {labels.eyebrow}
              </div>
              <h1 className="mt-6 max-w-195 text-[2.75rem] font-black leading-[1.08] tracking-normal text-[#111827] sm:text-[4rem]">
                {document.title}
              </h1>
              <p className="mt-5 max-w-175 text-[1.05rem]/8 font-medium text-[#4e5968]">
                {document.description}
              </p>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#e5e8eb] bg-[#fbfcfd] p-4">
              <a
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#191f28] px-4 text-[14px] font-bold text-white transition hover:bg-[#333d4b]"
                href={`/policy/${labels.switchSegment}/`}
              >
                View {labels.switchLabel}
              </a>
              <div className="grid gap-2 text-[13px] font-semibold text-[#6b7684]">
                <MetaLine icon={<GlobeIcon />} label="Website" value="sendquiz.net" />
                <MetaLine icon={<MailIcon />} label="Contact" value="support@sendquiz.net" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-8 sm:px-8 lg:p-12">
          <div className="mx-auto grid max-w-312 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <nav className="rounded-lg border border-[#e5e8eb] bg-white p-4 shadow-[0_10px_30px_rgba(25,31,40,0.05)]" aria-label="Legal sections">
                <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8b95a1]">Contents</p>
                <SectionLinks sections={document.sections} variant="desktop" />
              </nav>
            </aside>

            <article className="min-w-0 rounded-lg border border-[#e5e8eb] bg-white shadow-[0_16px_44px_rgba(25,31,40,0.06)]">
              <DocumentMeta meta={document.meta} />
              <div className="px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
                <div className="lg:hidden">
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8b95a1]">Contents</p>
                  <SectionLinks sections={document.sections} variant="mobile" />
                </div>

                <div className="space-y-6">
                  {document.blocks.map((block, index) => (
                    <PolicyBlockView block={block} key={`${block.type}-${index}`} />
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

function DocumentMeta({ meta }: { meta: PolicyDocumentMeta[] }) {
  return (
    <dl className="grid border-b border-[#e5e8eb] bg-[#fbfcfd] sm:grid-cols-2 lg:grid-cols-4">
      {meta.map((item) => (
        <div className="border-b border-[#e5e8eb] px-5 py-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0" key={item.label}>
          <dt className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-[#8b95a1]">
            {item.label.toLowerCase().includes('date') ? <CalendarIcon /> : <FileIcon />}
            {item.label}
          </dt>
          <dd className="mt-2 wrap-break-word text-[14px]/6 font-bold text-[#333d4b]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MetaLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className="text-[#3182f6]">{icon}</span>
      <span className="text-[#8b95a1]">{label}</span>
      <span className="min-w-0 truncate text-[#333d4b]">{value}</span>
    </p>
  );
}

function SectionLinks({ sections, variant }: { sections: PolicyHeadingBlock[]; variant: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <a
            className="whitespace-nowrap rounded-lg border border-[#e5e8eb] bg-[#f8f9fa] px-3 py-2 text-[13px] font-bold text-[#4e5968]"
            href={`#${section.id}`}
            key={section.id}
          >
            {stripLeadingNumber(section.text)}
          </a>
        ))}
      </div>
    );
  }

  return (
    <ol className="space-y-1">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            className="block rounded-lg px-3 py-2 text-[14px]/5 font-semibold text-[#4e5968] transition hover:bg-[#f2f4f6] hover:text-[#191f28]"
            href={`#${section.id}`}
          >
            {stripLeadingNumber(section.text)}
          </a>
        </li>
      ))}
    </ol>
  );
}

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  if (block.type === 'heading') {
    return <PolicyHeading block={block} />;
  }

  if (block.type === 'paragraph') {
    return (
      <p className="whitespace-pre-line text-[16px]/8 font-medium text-[#333d4b]">
        <InlineText text={block.text} />
      </p>
    );
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';

    return (
      <ListTag className="space-y-3 pl-5 text-[16px]/8 font-medium text-[#333d4b]">
        {block.items.map((item) => (
          <li className={block.ordered ? 'list-decimal pl-1' : 'list-disc pl-1'} key={item}>
            <InlineText text={item} />
          </li>
        ))}
      </ListTag>
    );
  }

  return <PolicyTable block={block} />;
}

function PolicyHeading({ block }: { block: PolicyHeadingBlock }) {
  if (block.level === 3) {
    return (
      <h3 className="scroll-mt-28 pt-3 text-[1.15rem]/7 font-black text-[#26313f]" id={block.id}>
        {block.text}
      </h3>
    );
  }

  return (
    <h2 className="scroll-mt-28 border-t border-[#eef0f3] pt-9 text-[1.55rem]/9 font-black text-[#111827] first:border-t-0 first:pt-0" id={block.id}>
      {block.text}
    </h2>
  );
}

function PolicyTable({ block }: { block: Extract<PolicyBlock, { type: 'table' }> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e8eb]">
      <div className="overflow-x-auto">
        <table className="min-w-184 w-full border-collapse text-left text-[14px]">
          <thead className="bg-[#f2f4f6] text-[#4e5968]">
            <tr>
              {block.headers.map((header) => (
                <th className="border-b border-[#e5e8eb] px-4 py-3 font-black" key={header}>
                  <InlineText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef0f3]">
            {block.rows.map((row, rowIndex) => (
              <tr className="align-top" key={`${row.join('-')}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    className={[
                      'px-4 py-4 leading-7 text-[#333d4b]',
                      cellIndex === 0 ? 'w-48 bg-[#fbfcfd] font-black text-[#26313f]' : 'font-medium',
                    ].join(' ')}
                    key={`${cell}-${cellIndex}`}
                  >
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi);

  return (
    <>
      {tokens.map((token, index) => {
        if (!token) {
          return null;
        }

        if (token.startsWith('**') && token.endsWith('**')) {
          return <strong className="font-black text-[#191f28]" key={`${token}-${index}`}>{token.slice(2, -2)}</strong>;
        }

        if (token.startsWith('`') && token.endsWith('`')) {
          return <code className="rounded-sm bg-[#f2f4f6] px-1.5 py-0.5 text-[0.92em] font-bold text-[#1d4ed8]" key={`${token}-${index}`}>{token.slice(1, -1)}</code>;
        }

        if (/^https?:\/\//.test(token)) {
          return (
            <a className="font-bold text-[#1d4ed8] underline decoration-[#bfdbfe] underline-offset-4" href={token} key={`${token}-${index}`}>
              {token}
            </a>
          );
        }

        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(token)) {
          return (
            <a className="font-bold text-[#1d4ed8] underline decoration-[#bfdbfe] underline-offset-4" href={`mailto:${token}`} key={`${token}-${index}`}>
              {token}
            </a>
          );
        }

        return token;
      })}
    </>
  );
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function CalendarIcon() {
  return (
    <SvgIcon>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </SvgIcon>
  );
}

function FileIcon() {
  return (
    <SvgIcon>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </SvgIcon>
  );
}

function GlobeIcon() {
  return (
    <SvgIcon>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 0 20" />
      <path d="M12 2a15.3 15.3 0 0 0 0 20" />
    </SvgIcon>
  );
}

function MailIcon() {
  return (
    <SvgIcon>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </SvgIcon>
  );
}

function ShieldIcon() {
  return (
    <SvgIcon>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.2 1.2 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </SvgIcon>
  );
}

function stripLeadingNumber(text: string) {
  return text.replace(/^\d+\.\s*/, '');
}
