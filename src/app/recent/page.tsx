import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { ReadingTabs } from '@/components/reading-tabs';
import { NewsFeed } from '@/components/news-feed';
import { Footer } from '@/components/footer';
export const metadata: Metadata = { title: 'Recently Read', robots: { index: false, follow: false } };
export default function Recent() {
  return <><Header saved/><ReadingTabs recent/><main id="main"><NewsFeed savedOnly recentOnly initial={{ articles: [], page: 1, totalPages: 1, total: 0 }}/></main><Footer/></>;
}
