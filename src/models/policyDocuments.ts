import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PolicyDocumentKind = 'privacy' | 'terms';

export type PolicyDocumentMeta = {
  label: string;
  value: string;
};

export type PolicyHeadingBlock = {
  id: string;
  level: 2 | 3;
  text: string;
  type: 'heading';
};

export type PolicyParagraphBlock = {
  text: string;
  type: 'paragraph';
};

export type PolicyListBlock = {
  items: string[];
  ordered: boolean;
  type: 'list';
};

export type PolicyTableBlock = {
  headers: string[];
  rows: string[][];
  type: 'table';
};

export type PolicyBlock = PolicyHeadingBlock | PolicyParagraphBlock | PolicyListBlock | PolicyTableBlock;

export type PolicyDocument = {
  blocks: PolicyBlock[];
  description: string;
  kind: PolicyDocumentKind;
  meta: PolicyDocumentMeta[];
  sections: PolicyHeadingBlock[];
  title: string;
};

const documents: Record<PolicyDocumentKind, PolicyDocument> = {
  privacy: createDocument({
    blocks: parsePolicyMarkdown(readPolicyMarkdown('privacy-policy')),
    description: 'SEND 개인정보 처리 기준과 English Privacy Policy입니다.',
    kind: 'privacy',
    meta: [
      { label: 'Version', value: '1.0' },
      { label: 'Effective date', value: '2026-05-20' },
      { label: 'Operator', value: 'JIHYUK JUNG' },
      { label: 'Public URL', value: 'https://sendquiz.net/policy/privacy-policy/' },
    ],
    title: '개인정보처리방침 / Privacy Policy',
  }),
  terms: createDocument({
    blocks: parsePolicyMarkdown(readPolicyMarkdown('terms-of-service')),
    description: 'SEND 서비스 이용약관과 English Terms of Service입니다.',
    kind: 'terms',
    meta: [
      { label: 'Version', value: '1.0' },
      { label: 'Effective date', value: '2026-05-20' },
      { label: 'Operator', value: 'JIHYUK JUNG' },
      { label: 'Public URL', value: 'https://sendquiz.net/policy/terms-of-service/' },
    ],
    title: '서비스 이용약관 / Terms of Service',
  }),
};

const policyKindBySlug: Record<string, PolicyDocumentKind> = {
  'privacy-policy': 'privacy',
  'terms-of-service': 'terms',
};

function createDocument(input: Omit<PolicyDocument, 'sections'>): PolicyDocument {
  return {
    ...input,
    sections: input.blocks.filter((block): block is PolicyHeadingBlock => (
      block.type === 'heading' && block.level === 2
    )),
  };
}

function readPolicyMarkdown(slug: string) {
  return readFileSync(join(process.cwd(), 'content', 'policy', `${slug}.md`), 'utf8');
}

function parsePolicyMarkdown(markdown: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  const lines = markdown.split('\n');
  let index = 0;
  let headingIndex = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line || line === '---') {
      index += 1;
      continue;
    }

    const heading = parseHeading(line, headingIndex + 1);
    if (heading) {
      headingIndex += 1;
      blocks.push(heading);
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const table = readTable(lines, index);
      blocks.push(table.block);
      index = table.nextIndex;
      continue;
    }

    const list = readList(lines, index);
    if (list) {
      blocks.push(list.block);
      index = list.nextIndex;
      continue;
    }

    const paragraph = readParagraph(lines, index);
    blocks.push(paragraph.block);
    index = paragraph.nextIndex;
  }

  return blocks;
}

function parseHeading(line: string, index: number): PolicyHeadingBlock | null {
  const heading = line.match(/^(#{1,3})\s+(.+)$/);
  if (!heading) return null;

  return {
    id: `section-${index}`,
    level: heading[1].length >= 3 ? 3 : 2,
    text: stripMarkdown(heading[2]),
    type: 'heading',
  };
}

function readTable(lines: string[], index: number) {
  const tableLines: string[] = [];
  let nextIndex = index;

  while (nextIndex < lines.length && lines[nextIndex].trim().startsWith('|')) {
    tableLines.push(lines[nextIndex].trim());
    nextIndex += 1;
  }

  return {
    block: parseTable(tableLines),
    nextIndex,
  };
}

function readList(lines: string[], index: number): { block: PolicyListBlock; nextIndex: number } | null {
  const firstItem = parseListItem(lines[index]);
  if (!firstItem) return null;

  const items: string[] = [];
  let nextIndex = index;

  while (nextIndex < lines.length) {
    const item = parseListItem(lines[nextIndex], firstItem.ordered);
    if (!item) break;

    items.push(item.text);
    nextIndex += 1;
  }

  return {
    block: { items, ordered: firstItem.ordered, type: 'list' },
    nextIndex,
  };
}

function parseListItem(line: string, ordered?: boolean) {
  const trimmed = line.trim();
  const match = trimmed.match(ordered === false ? /^-\s+(.+)$/ : /^\d+\.\s+(.+)$/)
    ?? (ordered === true ? null : trimmed.match(/^-\s+(.+)$/));
  if (!match) return null;

  return {
    ordered: /^\d+\.\s+/.test(trimmed),
    text: stripMarkdown(match[1]),
  };
}

function readParagraph(lines: string[], index: number) {
  const paragraphLines: string[] = [];
  let nextIndex = index;

  while (nextIndex < lines.length && isParagraphLine(lines, nextIndex)) {
    paragraphLines.push(lines[nextIndex].trim().replace(/\s{2}$/, ''));
    nextIndex += 1;
  }

  return {
    block: {
      text: stripMarkdown(paragraphLines.join('\n')),
      type: 'paragraph' as const,
    },
    nextIndex,
  };
}

function isParagraphLine(lines: string[], index: number) {
  const line = lines[index].trim();
  return Boolean(line)
    && line !== '---'
    && !line.startsWith('#')
    && !line.startsWith('|')
    && !/^\d+\.\s+/.test(line)
    && !/^-\s+/.test(line)
    && !isTableStart(lines, index);
}

function isTableStart(lines: string[], index: number) {
  const line = lines[index]?.trim();
  const nextLine = lines[index + 1]?.trim();
  return Boolean(line?.startsWith('|') && nextLine && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(nextLine));
}

function parseTable(lines: string[]): PolicyTableBlock {
  const [headerLine, , ...rowLines] = lines;

  return {
    headers: parseTableRow(headerLine),
    rows: rowLines.map(parseTableRow),
    type: 'table',
  };
}

function parseTableRow(line: string) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => stripMarkdown(cell.trim()));
}

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

export function getPolicyDocumentBySlug(slug: string) {
  const kind = policyKindBySlug[slug];
  return kind ? documents[kind] : null;
}

export function getPolicyStaticPaths() {
  return Object.keys(policyKindBySlug).map((slug) => ({ params: { slug } }));
}
