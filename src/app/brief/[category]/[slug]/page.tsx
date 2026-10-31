import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Feed } from '@/components/feed';
import { Header } from '@/components/header';
import { getArticle, getFeed } from '@/lib/wordpress';
import { articleMetadata } from '@/lib/article-seo';
import { briefPath } from '@/lib/paths';

export const revalidate = 60;
type Props = { params: Promise<{ category: string; slug: string }> };
const loadBrief = cache(async (slug: string) => {
  const initial = await getFeed();
  const selected = initial.articles.find(article => article.slug === slug) || await getArticle(slug);
  return { initial, selected };
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { selected } = await loadBrief((await params).slug);
  // Short and full reading modes share the full article's canonical identity.
  return selected ? articleMetadata(selected) : { title: 'Story not found', robots: { index: false } };
}
export default async function BriefStory({ params }: Props) {
  const { category, slug } = await params;
  const { initial, selected } = await loadBrief(slug);
  if (!selected) notFound();
  if (category !== selected.category) permanentRedirect(briefPath(selected.slug, selected.category));
  const articles = initial.articles.some(article => article.id === selected.id)
    ? initial.articles : [selected, ...initial.articles];
  return <><Header/><div id="main"><Feed initial={{ ...initial, articles }} initialSlug={selected.slug}/></div></>;
}
