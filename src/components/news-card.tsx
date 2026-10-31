import Link from 'next/link';
import type { Article } from '@/lib/content';
import { articlePath, formatDate, sectionLabel } from '@/lib/paths';
import { BookmarkButton } from './story-actions';
import { StoryImage } from './story-image';

export function NewsCard({ article, variant = 'list', priority = false, kicker = 'section' }: { article: Article; variant?: 'lead' | 'tile' | 'list' | 'compact'; priority?: boolean; kicker?: 'section' | 'author' }) {
  const href = articlePath(article.slug, article.category);
  return <article className={`news-card news-card-${variant}`} data-story-id={article.id}>
    {variant !== 'compact' && <Link href={href} prefetch={false} className="news-card-image" tabIndex={-1} aria-hidden="true">
      <StoryImage src={article.image} alt="" priority={priority} sizes={variant === 'lead' ? '(max-width: 760px) 94vw, (max-width: 1100px) 55vw, 540px' : variant === 'tile' ? '(max-width: 760px) 44vw, 285px' : '(max-width: 760px) 110px, 180px'}/>
    </Link>}
    <div className="news-card-copy">
      <div className="news-kicker">{kicker === 'author' ? article.author : sectionLabel(article.category)}</div>
      <h2><Link href={href} prefetch={false}>{article.title}</Link></h2>
      <p className="news-card-summary">{article.summary}</p>
      <div className="news-card-meta"><span><time dateTime={article.date}>{formatDate(article.date)}</time><span className="news-card-reading"><span className="meta-dot">·</span>{article.readingMinutes} min read</span></span><BookmarkButton id={article.id}/></div>
    </div>
  </article>;
}
