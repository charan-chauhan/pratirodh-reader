import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { normalizeArticle, postSchema, type Article } from './content';
import { wordpressApiUrl } from './site';
import { z } from 'zod';
import { FEED_LIMIT, FEED_PAGE_SIZE, SEARCH_QUERY_LIMIT, normalizeSearch } from './news-settings';

export type FeedPage = { articles: Article[]; page: number; totalPages: number; total: number };
export class WordPressError extends Error {
  constructor(public status: number) { super('WordPress is temporarily unavailable. Please try again.'); }
}
const fields = 'id,slug,date_gmt,modified_gmt,link,title,excerpt,content,sticky,meta,categories,author,featured_media';
const authorSchema = z.object({ id: z.number(), name: z.string() });
const categorySchema = z.object({ id: z.number(), slug: z.string() });
const mediaSchema = z.object({
  id: z.number(), source_url: z.string().optional(), alt_text: z.string().optional(),
  media_details: z.object({ sizes: z.record(z.string(), z.object({ source_url: z.string() })).optional() }).optional(),
});
type CmsResult = { articles: Article[]; total: number; totalPages: number };
const pending = new Map<string, Promise<CmsResult>>();
// Best-effort, bounded reuse of public articles already fetched for the brief
// or search. Following a result need not repeat the same WordPress work.
const recentArticles = new Map<string, { article: Article; expires: number; bytes: number }>();
let recentArticleBytes = 0;
function rememberArticles(articles: Article[]) {
  for (const article of articles) {
    if (!article.body) continue;
    const bytes = JSON.stringify(article).length * 2;
    if (bytes > 8 * 1024 * 1024) continue;
    const previous = recentArticles.get(article.slug);
    if (previous) recentArticleBytes -= previous.bytes;
    recentArticles.delete(article.slug);
    recentArticles.set(article.slug, { article, expires: Date.now() + 60000, bytes });
    recentArticleBytes += bytes;
    while (recentArticles.size > 200 || recentArticleBytes > 8 * 1024 * 1024) {
      const oldest = recentArticles.keys().next().value!;
      recentArticleBytes -= recentArticles.get(oldest)!.bytes;
      recentArticles.delete(oldest);
    }
  }
}
function rememberedArticle(slug: string) {
  const entry = recentArticles.get(slug);
  return entry && entry.expires > Date.now() ? entry.article : null;
}
const compactArticle = (article: Article): Article => ({ ...article, body: '' });
function apiUrl() {
  const url = new URL(wordpressApiUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid WordPress API URL');
  return url.href.replace(/\/$/, '');
}
async function request(params: Record<string, string>) {
  const url = new URL(`${apiUrl()}/posts`);
  url.search = new URLSearchParams({ _fields: fields, ...params }).toString();
  const key = url.href;
  const existing = pending.get(key);
  if (existing) {
    const result = await existing;
    rememberArticles(result.articles);
    return result;
  }
  const task = cachedRequest(url.href);
  pending.set(key, task);
  try { const result = await task; rememberArticles(result.articles); return result; } finally { pending.delete(key); }
}
async function fetchResponse(url: URL): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (response.status < 500 || attempt === 1) return response;
    } catch { if (attempt === 1) throw new WordPressError(502); }
  }
  throw new WordPressError(502);
}

const cachedReference = unstable_cache(async (href: string) => {
  const response = await fetchResponse(new URL(href));
  if (!response.ok) throw new WordPressError(response.status);
  const items: unknown = await response.json();
  if (!Array.isArray(items)) throw new WordPressError(502);
  return { items: items as unknown[], totalPages: Number(response.headers.get('x-wp-totalpages') || 1) };
}, ['wordpress-reference-v1'], { revalidate: 60, tags: ['wordpress-posts'] });

async function referenceList(base: string, type: 'users' | 'categories', selected: string) {
  const items: unknown[] = [];
  for (let page = 1; ; page++) {
    const url = new URL(`${base}/${type}`);
    url.search = new URLSearchParams({ _fields: selected, per_page: '100', page: String(page) }).toString();
    const result = await cachedReference(url.href);
    items.push(...result.items);
    if (page >= result.totalPages) break;
  }
  return items;
}

async function performRequest(url: URL): Promise<CmsResult> {
  const response = await fetchResponse(url);
  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json().catch(() => null);
      if (error?.code === 'rest_post_invalid_page_number') return { articles: [], total: 0, totalPages: 0 };
    }
    throw new WordPressError(response.status);
  }
  try {
    const raw: unknown = await response.json();
    const posts = z.array(postSchema).parse(raw);
    if (!posts.length) return { articles: [], total: 0, totalPages: 0 };
    const base = apiUrl();
    const mediaIds = [...new Set(posts.map(post => post.featured_media || 0).filter(id => id > 0))].sort((a, b) => a - b);
    const mediaUrl = new URL(`${base}/media`);
    mediaUrl.search = new URLSearchParams({
      include: mediaIds.join(','), per_page: '100',
      _fields: 'id,source_url,alt_text,media_details.sizes.large.source_url',
    }).toString();
    // Batched lookups avoid WordPress running separate embedded REST requests
    // for every author, image and tag on each of the twenty stories.
    const [rawAuthors, rawCategories, rawMedia] = await Promise.all([
      referenceList(base, 'users', 'id,name'),
      referenceList(base, 'categories', 'id,slug'),
      mediaIds.length ? cachedReference(mediaUrl.href).then(result => result.items) : Promise.resolve([]),
    ]);
    const authors = new Map(z.array(authorSchema).parse(rawAuthors).map(author => [author.id, author]));
    const categories = new Map(z.array(categorySchema).parse(rawCategories).map(category => [category.id, { ...category, taxonomy: 'category' }]));
    const media = new Map(z.array(mediaSchema).parse(rawMedia).map(image => [image.id, image]));
    const articles = posts.map(post => normalizeArticle({ ...post, _embedded: {
      author: authors.has(post.author || 0) ? [authors.get(post.author || 0)] : [],
      'wp:featuredmedia': media.has(post.featured_media || 0) ? [media.get(post.featured_media || 0)] : [],
      'wp:term': [[...categories.values()].filter(category => (post.categories || []).includes(category.id))],
    } }));
    return {
      articles: url.searchParams.get('per_page') === '100' ? articles.map(compactArticle) : articles,
      total: Number(response.headers.get('x-wp-total') || posts.length),
      totalPages: Number(response.headers.get('x-wp-totalpages') || 1),
    };
  } catch { throw new WordPressError(502); }
}
// Cache the validated compact result, rather than WordPress's oversized embeds.
// This app uses the App Router revalidate model, without Cache Components.
const cachedRequest = unstable_cache(
  (href: string) => performRequest(new URL(href)),
  ['wordpress-normalized-v3'],
  { revalidate: 60, tags: ['wordpress-posts'] },
);
export async function getFeed(page = 1): Promise<FeedPage> {
  if (!Number.isInteger(page) || page < 1 || page > Math.ceil(FEED_LIMIT / FEED_PAGE_SIZE)) throw new WordPressError(400);
  const result = await request({ page: String(page), per_page: String(FEED_PAGE_SIZE), orderby: 'date', order: 'desc' });
  return { ...result, articles: result.articles.map(compactArticle), page, total: Math.min(FEED_LIMIT, result.total), totalPages: Math.min(Math.ceil(FEED_LIMIT / FEED_PAGE_SIZE), result.totalPages) };
}
export async function getCategoryFeed(slug: string, page = 1, perPage = FEED_PAGE_SIZE): Promise<FeedPage | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug) || !Number.isInteger(page) || page < 1 || page > 9999) throw new WordPressError(400);
  const categories = z.array(categorySchema).parse(await referenceList(apiUrl(), 'categories', 'id,slug'));
  const category = categories.find(item => item.slug === slug);
  if (!category) return null;
  const result = await request({ categories: String(category.id), page: String(page), per_page: String(perPage), orderby: 'date', order: 'desc' });
  return { ...result, articles: result.articles.map(compactArticle), page };
}
export async function searchArticles(query: string, page = 1): Promise<FeedPage> {
  const search = normalizeSearch(query);
  if (!search || search.length > SEARCH_QUERY_LIMIT || !Number.isInteger(page) || page < 1 || page > 9999) throw new WordPressError(400);
  const result = await request({ search, page: String(page), per_page: String(FEED_PAGE_SIZE), orderby: 'relevance', order: 'desc' });
  return { ...result, articles: result.articles.map(compactArticle), page };
}
/** Archive discovery stays independent of the daily brief's 100-story limit. */
export async function getPublishedTotal() {
  return (await request({ per_page: '1' })).total;
}
export const getArticle = cache(async (slug: string) => {
  const remembered = rememberedArticle(slug);
  if (remembered) return remembered;
  const result = await request({ slug, per_page: '1' });
  return result.articles[0] || null;
});
export async function getArticlesByIds(ids: number[]) {
  if (!ids.length) return [];
  const selected = ids.slice(0, 30);
  const remembered = selected.map(id => [...recentArticles.values()].find(entry => entry.article.id === id && entry.expires > Date.now())?.article);
  if (remembered.every((article): article is Article => !!article)) return remembered.map(compactArticle);
  return (await request({ include: selected.join(','), per_page: '30', orderby: 'include' })).articles.map(compactArticle);
}
export async function getSitemapPage(page: number) {
  return request({ page: String(page), per_page: '100', orderby: 'date', order: 'desc' });
}
