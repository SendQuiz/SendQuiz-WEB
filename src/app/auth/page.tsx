import type { Metadata } from 'next';
import AuthPanel from './auth-panel';
import { getAuthTitle, normalizeMode } from '../../utils/authClient';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  return { title: getAuthTitle(normalizeMode(query.mode)), robots: { index: false, follow: false } };
}

export default async function AuthPage({ searchParams }: Props) {
  const query = Object.fromEntries(Object.entries(await searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return <AuthPanel query={query} />;
}
