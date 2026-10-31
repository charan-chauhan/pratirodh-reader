import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StoryImage } from '@/components/story-image';
import { SearchPageLink } from '@/components/search-page-link';
import { Search, ArrowLeft, ArrowUpRight } from '@/components/icons';
import { searchArticles, type FeedPage } from '@/lib/wordpress';
import { articlePath, formatDate, sectionLabel } from '@/lib/paths';
import { normalizeSearch, SEARCH_QUERY_LIMIT } from '@/lib/news-settings';

export const metadata: Metadata = {
  title: 'Search Stories', description: 'Search the Pratirodh archive for independent reporting, news and analysis.',
  robots: { index: false, follow: true }, alternates: { canonical: '/search/' },
};
type Props = { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> };
const searchPath = (query: string, page: number) => `/search/?${new URLSearchParams({ q: query, ...(page > 1 ? { page: String(page) } : {}) })}`;

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = normalizeSearch(typeof params.q === 'string' ? params.q : params.q?.[0] || '');
  const requestedPage = typeof params.page === 'string' ? params.page : '1';
  const page = /^[1-9]\d{0,3}$/.test(requestedPage) ? Number(requestedPage) : 1;
  let result: FeedPage | null = null;
  let error = '';
  if (query.length > SEARCH_QUERY_LIMIT) error = 'Please keep your search within 200 characters.';
  else if (query) {
    try { result = await searchArticles(query, page); }
    catch { error = 'We couldn’t reach the newsroom. Please try your search again.'; }
  }
  return <><Header/><main id="main" className="search-page">
    <Link href="/" className="back-link"><ArrowLeft size={16}/> Back to All Stories</Link>
    <div className="article-eyebrow">THE PRATIRODH ARCHIVE</div>
    <h1>Search the Archive</h1>
    <p className="search-intro">Search all our published stories by topic, person, or keyword.</p>
    <form action="/search/" method="get" role="search" className="story-search-form">
      <label htmlFor="story-search">Search Stories</label>
      <div><Search size={20} aria-hidden="true"/><input id="story-search" type="search" name="q" defaultValue={query} maxLength={SEARCH_QUERY_LIMIT} placeholder="What would you like to explore?" autoComplete="off"/><button type="submit">Search <ArrowUpRight size={16}/></button></div>
    </form>
    {error ? <section className="search-message" role="alert"><h2>A brief pause.</h2><p>{error}</p><Link className="text-button" href={searchPath(query.slice(0, SEARCH_QUERY_LIMIT), page)}>Try Again</Link></section>
      : result ? <section className="search-results" aria-labelledby="search-results-heading">
        <div className="search-results-heading"><h2 id="search-results-heading">Results for “{query}”</h2><span>{result.total.toLocaleString('en-IN')} {result.total === 1 ? 'story' : 'stories'}</span></div>
        {result.articles.length ? <>
          <div className="search-results-list">{result.articles.map(article => <article className="search-result" key={article.id}>
            <Link href={articlePath(article.slug, article.category)} className="search-result-image" tabIndex={-1} aria-hidden="true"><StoryImage src={article.image} alt="" sizes="(max-width: 760px) 100px, 180px"/></Link>
            <div><div className="search-result-meta"><span>{sectionLabel(article.category)}</span><time dateTime={article.date}>{formatDate(article.date)}</time></div><h3><Link href={articlePath(article.slug, article.category)}>{article.title}</Link></h3><p>{article.summary.slice(0, 180)}{article.summary.length > 180 ? '…' : ''}</p><span className="search-result-author">{article.author}</span></div><ArrowUpRight size={19} className="search-result-arrow" aria-hidden="true"/>
          </article>)}</div>
          <nav className="search-pagination" aria-label="Search results pages">
            {page > 1 ? <SearchPageLink href={searchPath(query, page - 1)} label="← Previous"/> : <span/>}<span>Page {page} of {result.totalPages.toLocaleString('en-IN')}</span>{page < result.totalPages ? <SearchPageLink href={searchPath(query, page + 1)} label="Next →"/> : <span/>}
          </nav>
        </> : <div className="search-message"><Search size={30}/><h3>No stories found.</h3><p>Try a different keyword or a shorter phrase.</p>{page > 1 && <Link className="text-button" href={searchPath(query, 1)}>Back to First Page</Link>}</div>}
      </section> : <div className="search-message search-welcome"><Search size={28}/><p>A name. A place. An idea.<br/>Find the reporting behind what matters to you.</p></div>}
  </main><Footer/></>;
}
