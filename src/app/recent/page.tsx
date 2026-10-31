import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { ReadingTabs } from '@/components/reading-tabs';
import { Feed } from '@/components/feed';
export const metadata: Metadata = { title: 'Recently read', robots: { index: false, follow: false } };
export default function Recent() {
  return <><Header saved/><ReadingTabs recent/><div id="main"><Feed savedOnly recentOnly initial={{ articles: [], page: 1, totalPages: 1, total: 0 }}/></div></>;
}
