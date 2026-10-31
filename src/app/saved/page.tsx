import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { NewsFeed } from '@/components/news-feed';
import { Footer } from '@/components/footer';
import { ReadingTabs } from '@/components/reading-tabs';
export const metadata: Metadata = { title: 'Saved Stories', robots: { index: false, follow: false } };
export default function Saved() {
  return <><Header saved/><ReadingTabs/><main id="main"><NewsFeed savedOnly initial={{ articles: [], page: 1, totalPages: 1, total: 0 }}/></main><Footer/></>;
}
