'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Article } from '@/lib/content';
import type { FeedPage } from '@/lib/wordpress';
import { FEED_LIMIT } from '@/lib/news-settings';
import { readSaved } from './story-actions';
import { Bookmark, Search, ArrowUpRight, RefreshCw } from './icons';
import { NewsCard } from './news-card';

export function NewsFeed({ initial, savedOnly = false, recentOnly = false, children }: { initial: FeedPage; savedOnly?: boolean; recentOnly?: boolean; children?: ReactNode }) {
  const [articles, setArticles] = useState(initial.articles);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(savedOnly);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!savedOnly) return;
    const sync = () => setRevision(value => value + 1);
    window.addEventListener('pratirodh:saved', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('pratirodh:saved', sync); window.removeEventListener('storage', sync); };
  }, [savedOnly]);
  useEffect(() => {
    if (!savedOnly) return;
    const controller = new AbortController();
    async function load() {
      let ids = readSaved();
      if (recentOnly) {
        try { const value: unknown = JSON.parse(localStorage.getItem('pratirodh:recent') || '[]'); ids = Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, 30) : []; }
        catch { ids = []; }
      }
      if (!ids.length) { setArticles([]); setLoading(false); return; }
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/news?ids=${ids.join(',')}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json(); setArticles(data.articles);
      } catch { if (!controller.signal.aborted) setError('Your stories couldn’t be loaded. Please try again.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [savedOnly, recentOnly, revision]);
  const loadMore = useCallback(async () => {
    if (busy.current || page >= totalPages || articles.length >= FEED_LIMIT) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const response = await fetch(`/api/news?page=${page + 1}`);
      if (!response.ok) throw new Error();
      const result: FeedPage = await response.json();
      setArticles(previous => [...previous, ...result.articles.filter(article => !previous.some(item => item.id === article.id))].slice(0, FEED_LIMIT));
      setPage(result.page); setTotalPages(result.totalPages);
    } catch { setError('More stories couldn’t be loaded. Please try again.'); }
    finally { busy.current = false; setLoading(false); }
  }, [page, totalPages, articles.length]);

  const collectionTitle = recentOnly ? 'Recently Read' : 'Saved Stories';
  if (savedOnly) return <section className="library-page">
    <div className="section-heading"><div><div className="news-kicker">YOUR READING ROOM</div><h1>{collectionTitle}</h1></div><span>{articles.length} {articles.length === 1 ? 'story' : 'stories'}</span></div>
    {loading && <p className="collection-status" role="status"><span className="loading-spinner"/>Loading your stories…</p>}
    {error && <p role="alert">{error} <button className="text-button" onClick={() => setRevision(value => value + 1)}>Try Again</button></p>}
    {articles.length ? <div className="news-list">{articles.map(article => <NewsCard key={article.id} article={article}/>)}</div> : !loading && !error && <div className="empty-state"><Bookmark size={30}/><h2>{recentOnly ? 'Your reading history starts here.' : 'Good stories are worth keeping.'}</h2><p>{recentOnly ? 'Articles you open will appear here on this device.' : 'Use the bookmark on a story to save it for later on this device.'}</p><Link className="primary-button" href="/">Explore the Latest News <ArrowUpRight size={16}/></Link></div>}
  </section>;

  if (!articles.length) return <div className="empty-state"><h1>The latest stories are on their way.</h1><p>Please check back shortly.</p><button className="primary-button" onClick={() => location.reload()}>Try Again</button></div>;
  return <>
    <h1 className="sr-only">Pratirodh: independent news, views and analysis</h1>
    <section className="front-page" aria-label="Top stories">
      <div className="front-main"><NewsCard article={articles[0]} variant="lead" priority/>
        <div className="lead-followups">{articles.slice(1, 3).map(article => <NewsCard key={article.id} article={article} variant="compact"/>)}</div>
      </div>
      <aside className="front-sidebar" aria-label="More top stories"><h2 className="column-heading">In the Headlines</h2>{articles.slice(3, 6).map((article, index) => <NewsCard key={article.id} article={article} variant={index === 0 ? 'tile' : 'compact'}/>)}</aside>
    </section>
    {articles.length > 6 && <section className="headline-section" aria-labelledby="more-headlines"><div className="section-heading"><h2 id="more-headlines">More Headlines</h2><span>Reporting from India & beyond</span></div><div className="headlines-grid">{articles.slice(6, 10).map(article => <NewsCard key={article.id} article={article} variant="tile"/>)}</div></section>}
    {children}
    <section id="latest" className="latest-section" aria-labelledby="latest-heading"><div className="section-heading"><h2 id="latest-heading">Latest Stories</h2><span>{articles.length} stories · Updated throughout the day</span></div>
      <div className="latest-layout"><div>
        <div className="news-list">{articles.slice(10).map(article => <NewsCard key={article.id} article={article}/>)}</div>
        <div className="load-more-area">
          {error && <p role="alert">{error}</p>}
          {page < totalPages && articles.length < FEED_LIMIT ? <button className="load-more-button" onClick={loadMore} disabled={loading}>{loading ? <><span className="loading-spinner"/>Loading Stories…</> : error ? <><RefreshCw size={15}/>Try Again</> : 'Load More Stories'}</button> : <Link className="text-button" href="/search/">Explore the Full Archive <ArrowUpRight size={15}/></Link>}
          <p role="status">{loading ? 'Loading more reporting. You can keep reading.' : `Showing ${articles.length} of ${Math.min(FEED_LIMIT, initial.total)} latest stories`}</p>
        </div>
      </div><aside className="newsroom-note"><div className="news-kicker">THE PRATIRODH PERSPECTIVE</div><h2>A space for<br/><em>every voice.</em></h2><p>Independent journalism. Original reporting. The stories of people, their struggles and the world we share.</p><Link href="/about-us/">Get to Know Us <ArrowUpRight size={15}/></Link><div className="note-divider"/><Search size={23}/><h3>Follow your curiosity.</h3><p>Explore our archive by a name, a place, or an idea.</p><Link href="/search/">Search the Archive <ArrowUpRight size={15}/></Link></aside></div>
    </section>
  </>;
}
