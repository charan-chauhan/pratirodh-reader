import Link from 'next/link';
import type { Article } from '@/lib/content';
import type { Section } from '@/lib/sections';
import { sectionPath } from '@/lib/paths';
import { Carousel } from './carousel';
import { ArrowUpRight } from './icons';
import { NewsCard } from './news-card';

function SectionStories({ section, articles }: { section: Section; articles: Article[] }) {
  switch (section.layout) {
    case 'carousel':
    case 'gallery':
      return <Carousel label={section.label}>{articles.map(article => <NewsCard key={article.id} article={article} variant="tile"/>)}</Carousel>;
    case 'feature':
      return <div className="section-feature"><NewsCard article={articles[0]} variant="lead"/><div className="section-feature-list">{articles.slice(1, 4).map(article => <NewsCard key={article.id} article={article} variant="list"/>)}</div></div>;
    case 'digest':
      return <div className="section-digest">
        <div className="digest-lead"><NewsCard article={articles[0]} variant="tile"/></div>
        <div className="digest-list">{articles.slice(1, 5).map(article => <NewsCard key={article.id} article={article} variant="list"/>)}</div>
      </div>;
    case 'opinion':
      return <div className="section-opinion">{articles.slice(0, 4).map(article => <NewsCard key={article.id} article={article} variant="compact" kicker="author"/>)}</div>;
    default:
      return <div className="headlines-grid">{articles.slice(0, 4).map(article => <NewsCard key={article.id} article={article} variant="tile"/>)}</div>;
  }
}

export function SectionBlock({ section, articles }: { section: Section; articles: Article[] }) {
  if (!articles.length) return null;
  const href = sectionPath(section.slug);
  const heading = `section-${section.slug}`;
  return <section className={`home-section home-section-${section.layout}`} aria-labelledby={heading}>
    <div className="section-heading"><h2 id={heading}><Link href={href}>{section.label}</Link></h2><Link href={href} className="section-more" aria-label={`More in ${section.label}`}><ArrowUpRight size={16}/></Link></div>
    <SectionStories section={section} articles={articles}/>
  </section>;
}

