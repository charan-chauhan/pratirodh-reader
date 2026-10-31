import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Header } from '@/components/header';
import { BookmarkButton, ShareButton } from '@/components/reader-controls';
import { ArrowLeft, ArrowUpRight } from '@/components/icons';
import { articlePath, briefPath, formatDate } from '@/lib/paths';
import { getArticle, getFeed } from '@/lib/wordpress';
import { articleMetadata, structuredDataJson } from '@/lib/article-seo';
import { StoryImage } from '@/components/story-image';
import { plainText } from '@/lib/content';
export const revalidate = 60;
type Props = { params: Promise<{ slug: string; category?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { title: 'Story not found' };
  return articleMetadata(article);
}
export default async function ArticlePage({ params }: Props) {
  const { slug, category = 'news' } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  if (category !== article.category) permanentRedirect(articlePath(article.slug, article.category));
  const related = await getFeed().then(feed => feed.articles.filter(a => a.id !== article.id).slice(0, 3)).catch(() => []);

  return <><Header/><main id="main" className="article-page"><Link href={briefPath(article.slug, article.category)} className="back-link"><ArrowLeft size={16}/> Back to your brief</Link><article><div className="article-eyebrow">INDEPENDENT VOICES · ESSENTIAL STORIES</div><h1>{article.title}</h1><div className="article-info"><div><strong>{article.author}</strong><p><time dateTime={article.date}>{formatDate(article.date)}</time> · {article.readingMinutes} min read{article.modified !== article.date && <> · Updated {formatDate(article.modified)}</>}</p></div><div className="article-action-group"><BookmarkButton id={article.id}/><ShareButton slug={article.slug} category={article.category} title={article.title}/></div></div><figure className="article-hero"><StoryImage src={article.image} alt={article.imageAlt} hero/></figure><div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }}/><div className="article-end"><span>Good journalism deserves to be shared.</span><ShareButton slug={article.slug} category={article.category} title={article.title} labeled/></div><a className="source-link" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">View original on Pratirodh <ArrowUpRight size={15}/></a></article>{related.length > 0 && <section className="related"><h2>Keep your perspective open.</h2>{related.map(a => <Link key={a.id} href={articlePath(a.slug, a.category)}>{a.title}<ArrowUpRight size={18}/></Link>)}</section>}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson(article, plainText(article.body)) }}/></main></>;
}
