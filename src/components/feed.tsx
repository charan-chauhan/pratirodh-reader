'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Article } from '@/lib/content';
import type { FeedPage } from '@/lib/wordpress';
import { articlePath, briefPath, formatDate } from '@/lib/paths';
import { ArrowDown, ArrowUp, ArrowUpRight, Bookmark, Clock, RefreshCw } from './icons';
import { BookmarkButton, readSaved, ShareButton } from './reader-controls';
import { StoryImage } from './story-image';
import { ActiveStorySeo } from './active-story-seo';
import { useReaderNavigation } from './use-reader-navigation';
import { FEED_LIMIT } from '@/lib/news-settings';

export function Feed({ initial, savedOnly = false, recentOnly = false, initialSlug }: { initial: FeedPage; savedOnly?: boolean; recentOnly?: boolean; initialSlug?: string }) {
  const initialIndex = Math.max(0, initial.articles.findIndex(article => article.slug === initialSlug));
  const [articles, setArticles] = useState(initial.articles);
  const [active, setActive] = useState(initialIndex);
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => { setHydrated(true); }, []);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(savedOnly);
  const [error, setError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const activeRef = useRef(initialIndex);
  const restored = useRef(false);
  const [savedRevision, setSavedRevision] = useState(0);
  const loadMore = useCallback(async () => {
    if (savedOnly || busy.current || page >= totalPages) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const response = await fetch(`/api/news?page=${page + 1}`);
      if (!response.ok) throw new Error();
      const result: FeedPage = await response.json();
      setArticles(previous => [...previous, ...result.articles.filter(a => !previous.some(p => p.id === a.id))].slice(0, FEED_LIMIT));
      setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError('The next stories couldn’t be loaded.'); }
    finally { busy.current = false; setLoading(false); }
  }, [page, totalPages, savedOnly]);

  useEffect(() => {
    if (!savedOnly) return;
    const sync = () => setSavedRevision(value => value + 1);
    window.addEventListener('pratirodh:saved', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('pratirodh:saved', sync); window.removeEventListener('storage', sync); };
  }, [savedOnly]);

  useEffect(() => {
    if (!savedOnly) return;
    const controller = new AbortController();
    async function loadSaved() {
      let ids = readSaved();
      if (recentOnly) {
        try { const recent: unknown = JSON.parse(localStorage.getItem('pratirodh:recent') || '[]'); ids = Array.isArray(recent) ? recent.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, 30) : []; }
        catch { ids = []; }
      }
      if (!ids.length) { setArticles([]); setLoading(false); return; }
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/news?ids=${ids.join(',')}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const result = await response.json(); setArticles(result.articles); setActive(0); activeRef.current = 0;
      } catch { if (!controller.signal.aborted) setError('Saved stories couldn’t be loaded.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadSaved();
    return () => controller.abort();
  }, [savedOnly, savedRevision, recentOnly]);

  const commitActive = useCallback((index: number) => {
    const article = articles[index];
    if (!article) return;
    setActive(index); activeRef.current = index;
    if (container.current) container.current.dataset.activeIndex = String(index);
    try {
      sessionStorage.setItem('pratirodh:position', article.slug);
      const recent: unknown = JSON.parse(localStorage.getItem('pratirodh:recent') || '[]');
      const ids = Array.isArray(recent) ? recent.filter(id => Number.isInteger(id) && id !== article.id) : [];
      localStorage.setItem('pratirodh:recent', JSON.stringify([article.id, ...ids].slice(0, 30)));
    } catch { /* Reading remains available without storage. */ }
    if (!savedOnly) history.replaceState(null, '', briefPath(article.slug, article.category));
  }, [articles, savedOnly]);
  const { navigate, step } = useReaderNavigation(container, articles.length, commitActive);

  useLayoutEffect(() => {
    if (restored.current || !articles.length || !container.current || (initialSlug && !hydrated)) return;
    restored.current = true;
    const index = Math.max(0, articles.findIndex(article => article.slug === initialSlug));
    container.current.scrollTo({ top: index * container.current.clientHeight, behavior: 'instant' });
    commitActive(index);
  }, [articles, initialSlug, hydrated, commitActive]);
  useEffect(() => {
    const onPop = () => {
      const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean).at(-1) || '');
      const index = articles.findIndex(article => article.slug === slug);
      if (index >= 0) navigate(index);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [articles, navigate]);
  useEffect(() => { if (active >= articles.length - 8 && articles.length && !error) void loadMore(); }, [active, articles.length, loadMore, error]);

  if (!articles.length) return <div className="empty-state"><Bookmark size={36}/><h1>{loading ? 'Finding your stories…' : recentOnly ? 'Your perspectives, revisited.' : savedOnly ? 'A little space for good stories.' : 'The next story is on its way.'}</h1><p>{error || (recentOnly ? 'Stories you read will appear here on this device.' : savedOnly ? 'Tap the bookmark on any story to keep it here. Your saved stories stay on this device.' : 'There are no published stories available yet.')}</p>{error ? <button className="primary-button" onClick={() => location.reload()}>Try again</button> : <Link className="primary-button" href="/">Read the daily brief <ArrowUpRight size={17}/></Link>}</div>;
  const nextArticle = articles[active + 1];
  // SSR shows the selected story immediately. Hydration restores the complete
  // chronological list and its scroll position before the browser paints.
  const renderedArticles = initialSlug && !hydrated ? [articles[initialIndex]] : articles;
  return <main className="reader-layout">
    {!savedOnly && <ActiveStorySeo article={articles[active] || articles[0]}/>}
    <div className="reader-intro">
      <div><div className="edition"><span className="live-dot"/> INDEPENDENT BY NATURE</div><h1>{recentOnly ? 'Worth another look.' : savedOnly ? 'Your own perspective.' : <>A little context. <em>A bigger picture.</em></>}</h1></div>
      <p>People first. Always.<br/><span>Essential stories. Room to think.</span></p>
    </div>
    <div className="reader-center">
      <div className="feed-heading"><span>{recentOnly ? 'Recently Read' : savedOnly ? 'Saved Stories' : 'The Daily Brief'}<span className="brief-divider">/</span><span className="brief-mode">The world, one story at a time</span></span><span className="brief-counter"><strong>{String(active + 1).padStart(2, '0')}</strong><span className="muted"> / {savedOnly ? articles.length : initial.total.toLocaleString('en-IN')}</span></span></div>
      <div className="feed-window" ref={container} tabIndex={0} aria-label="News stories. Swipe or use arrow keys to navigate.">
        {renderedArticles.map((article, position) => { const index = initialSlug && !hydrated ? initialIndex : position; return <article className="story-card" key={article.id} data-index={index} data-active={index === active} aria-label={`Story ${index + 1}: ${article.title}`} style={{ '--distance': index === active ? 0 : 1, '--offset': 0 } as CSSProperties}>
          <div className="story-surface">
            <div className="story-image"><StoryImage src={article.image} alt={article.imageAlt} priority={index === active} eager={Math.abs(index - active) <= 2}/><div className="image-shade"/><span className="image-label">{article.featured ? 'Editor’s Pick' : 'In Focus'}</span><div className="image-footnote"><span className="image-story-index">{String(index + 1).padStart(2, '0')}<span> / THE BRIEF</span></span><span className="image-credit">A PRATIRODH PERSPECTIVE</span></div></div>
            <div className="story-copy">
              <div className="story-meta"><span className="story-category">{article.category.replace(/-/g, ' ')}</span><time dateTime={article.date}>{formatDate(article.date)}</time></div>
              <h2><a href={articlePath(article.slug, article.category)}>{article.title}</a></h2>
              <div className="story-summary" tabIndex={0} role="region" aria-label="Story summary"><p>{article.summary}</p></div>
              <div className="story-byline"><span><span className="author-mark" aria-hidden="true">P</span><span>Reported by <strong>{article.author}</strong></span></span><span><Clock size={13}/>{article.readingMinutes} min read</span></div>
              <div className="story-bottom"><a href={articlePath(article.slug, article.category)} className="read-story">Read Full Story <ArrowUpRight size={18}/></a><div className="story-actions"><BookmarkButton id={article.id}/><ShareButton slug={article.slug} category={article.category} title={article.title}/></div></div>
            </div>
          </div>
        </article>; })}
      </div>
      <div className="reader-dock">
        <div className="next-preview">
          <span>{nextArticle ? 'UP NEXT' : loading ? 'LOADING STORIES' : error ? 'TRY AGAIN' : 'YOU’RE ALL CAUGHT UP'}</span>
          <p>{nextArticle?.title || (loading ? 'Please wait. Swipe when loading finishes.' : error ? 'Your next stories couldn’t be loaded.' : 'Take a moment. Stay curious.')}</p>
          {(loading || error) && <div className="reader-load-status" role="status">
            {loading ? <><span className="reader-spinner" aria-hidden="true"/><span>Loading more stories…</span></> : <button className="text-button" onClick={loadMore}><RefreshCw size={13}/> Retry loading stories</button>}
          </div>}
        </div>

        <div className="reader-tools"><button className="round-button" disabled={active === 0} onClick={() => step(-1)} aria-label="Previous story"><ArrowUp size={18}/></button><button className="round-button next-button" disabled={active === articles.length - 1} onClick={() => step(1)} aria-label="Next story"><ArrowDown size={18}/></button></div>
        <div className="mobile-navigation"><button disabled={active === 0} onClick={() => step(-1)} aria-label="Previous story"><ArrowUp size={18}/></button><button disabled={active === articles.length - 1} onClick={() => step(1)} aria-label="Next story"><ArrowDown size={18}/></button></div>
      </div>
      <div className="feed-caption"><span className="swipe-cue"><span/>Swipe up for a new perspective</span><span className="desktop-cue">SCROLL OR USE ↑ ↓</span><span className="caption-signature">Less noise. More understanding.</span></div>
    </div>
    <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">Story {active + 1} of {articles.length}: {articles[active]?.title}</span>
  </main>;
}
