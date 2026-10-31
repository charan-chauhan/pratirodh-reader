import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import { BookmarkButton, ShareButton } from './story-actions';
import { ArrowLeft } from './icons';
import { articlePath, formatDate, sectionLabel } from '@/lib/paths';
import { getArticle, getFeed } from '@/lib/wordpress';
import { articleMetadata, structuredDataJson } from '@/lib/article-seo';
import { StoryImage } from './story-image';
import { plainText } from '@/lib/content';
import { pageSafeUploads } from '@/lib/site';
import { NewsCard } from './news-card';
import { ReadHistory } from './read-history';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string; category?: string }> };
const loadArticle = cache(async (slug: string) => {
  const feed = await getFeed().catch(() => null);
  const article = await getArticle(slug);
  return { article, related: feed?.articles.filter(item => item.id !== article?.id).slice(0, 4) || [] };
});
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { article } = await loadArticle((await params).slug);
  return article ? articleMetadata(article) : { title: 'Story Not Found' };
}
export default async function ArticlePage({ params }: Props) {
  const { slug, category = 'news' } = await params;
  const { article, related } = await loadArticle(slug);
  if (!article) notFound();
  if (category !== article.category) permanentRedirect(articlePath(article.slug, article.category));
  const repeatsBody = plainText(article.body).startsWith(article.summary.slice(0, 80));
  const clipped = article.summary.slice(0, 280).replace(/\s+\S*$/, '');
  const deck = repeatsBody ? '' : article.summary.length <= 280 ? article.summary : /[.!?।]$/.test(clipped) ? clipped : clipped + '…';
  const section = sectionLabel(article.category);
  return <><Header/><main id="main" className="article-page">
    <ReadHistory id={article.id}/>
    <Link href="/" className="back-link"><ArrowLeft size={14}/> All Stories</Link>
    <article>
      <header className="article-heading"><Link className="article-eyebrow" href={`/search/?q=${encodeURIComponent(section)}`}>{section}</Link><h1>{article.title}</h1>{deck && <p className="article-deck">{deck}</p>}
        <div className="article-info"><div><strong>By {article.author}</strong><p><time dateTime={article.date}>{formatDate(article.date)}</time><span> · {article.readingMinutes} min read</span>{article.modified !== article.date && <span> · Updated {formatDate(article.modified)}</span>}</p></div><div className="article-action-group"><BookmarkButton id={article.id}/><ShareButton slug={article.slug} category={article.category} title={article.title}/></div></div>
      </header>
      <figure className="article-hero"><StoryImage src={article.image} alt={article.imageAlt} hero/></figure>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: pageSafeUploads(article.body) }}/>
      <div className="article-end"><p>Independent reporting. A wider perspective.</p><div><BookmarkButton id={article.id} labeled/><ShareButton slug={article.slug} category={article.category} title={article.title} labeled/></div></div>
      <a className="source-link" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">View original on Pratirodh ↗</a>
    </article>
    {related.length > 0 && <section className="related"><div className="section-heading"><h2>More from Pratirodh</h2><Link href="/">All Stories →</Link></div><div className="headlines-grid">{related.map(item => <NewsCard key={item.id} article={item} variant="tile"/>)}</div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson(article, plainText(article.body)) }}/>
  </main><Footer/></>;
}
