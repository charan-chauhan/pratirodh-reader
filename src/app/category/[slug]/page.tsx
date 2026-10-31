import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NewsCard } from '@/components/news-card';
import { sectionLabel, sectionPath } from '@/lib/paths';
import { getCategoryFeed } from '@/lib/wordpress';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
const pageNumber = (value?: string) => /^[1-9]\d{0,3}$/.test(value || '') ? Number(value) : 1;
const validSlug = (slug: string) => /^[a-z0-9-]{1,100}$/.test(slug);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) return { title: 'Section Not Found' };
  const page = pageNumber((await searchParams).page);
  const label = sectionLabel(slug);
  return { title: page > 1 ? `${label}, Page ${page}` : label, description: `The latest ${label} reporting from Pratirodh.`, alternates: { canonical: sectionPath(slug, page) } };
}
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!validSlug(slug)) notFound();
  const page = pageNumber((await searchParams).page);
  const feed = await getCategoryFeed(slug, page);
  if (!feed?.articles.length) notFound();
  const label = sectionLabel(slug);
  const [lead, ...rest] = feed.articles;
  return <><Header/><main id="main" className="section-page">
    <header className="section-page-heading"><h1>{label}</h1><span>{feed.total} {feed.total === 1 ? 'story' : 'stories'}</span></header>
    {page === 1 && <div className="section-lead"><NewsCard article={lead} variant="lead" priority/></div>}
    <div className="news-list">{(page === 1 ? rest : feed.articles).map(article => <NewsCard key={article.id} article={article}/>)}</div>
    <nav className="section-pagination" aria-label={`${label} pages`}>
      {page > 1 ? <Link href={sectionPath(slug, page - 1)}>← Newer stories</Link> : <span/>}
      <span>Page {page} of {feed.totalPages}</span>
      {page < feed.totalPages ? <Link href={sectionPath(slug, page + 1)}>Older stories →</Link> : <span/>}
    </nav>
  </main><Footer/></>;
}
