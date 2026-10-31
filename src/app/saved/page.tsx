import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Feed } from '@/components/feed';
import { ReadingTabs } from '@/components/reading-tabs';
export const metadata: Metadata = { title: 'Saved stories', robots: { index: false, follow: false } };
export default function Saved() {
  return <><Header saved/><ReadingTabs/><div id="main"><Feed savedOnly initial={{ articles: [], page: 1, totalPages: 1, total: 0 }}/></div></>;
}
