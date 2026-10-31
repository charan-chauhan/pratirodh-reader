import { NewsFeed } from '@/components/news-feed';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SectionBlock } from '@/components/section-block';
import { getCategoryFeed, getFeed } from '@/lib/wordpress';
import { sections } from '@/lib/sections';
import type { Metadata } from 'next';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export const revalidate = 60;
const homeSections = sections.filter(section => section.home);
export default async function Home() {
  const [initial, ...sectionFeeds] = await Promise.all([getFeed(), ...homeSections.map(section => getCategoryFeed(section.slug, 1, 16).catch(() => null))]);
  const onFrontPage = new Set(initial.articles.slice(0, 10).map(article => article.id));
  return <><Header/><main id="main" className="news-home"><NewsFeed initial={initial}>
    {homeSections.map((section, index) => <SectionBlock key={section.slug} section={section} articles={(sectionFeeds[index]?.articles || []).filter(article => !onFrontPage.has(article.id))}/>)}
  </NewsFeed></main><Footer/></>;
}
