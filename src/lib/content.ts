import sanitizeHtml from 'sanitize-html';
import { decode } from 'he';
import { z } from 'zod';
import { fromLegacyUploads, pageSafeUploads } from './site';

const rendered = z.object({ rendered: z.string() });
export const postSchema = z.object({
  id: z.number().int().positive(), slug: z.string().min(1),
  date_gmt: z.string(), modified_gmt: z.string(), link: z.string(),
  title: rendered, excerpt: rendered, content: rendered,
  sticky: z.boolean().optional(),
  categories: z.array(z.number()).optional(),
  author: z.number().int().nonnegative().optional(),
  featured_media: z.number().int().nonnegative().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  _embedded: z.object({
    'wp:term': z.array(z.array(z.object({ id: z.number(), slug: z.string(), taxonomy: z.string() }).passthrough())).optional(),
    author: z.array(z.object({ name: z.string() })).optional(),
    'wp:featuredmedia': z.array(z.object({
      source_url: z.string().optional(), alt_text: z.string().optional(),
      media_details: z.object({ sizes: z.record(z.string(), z.object({ source_url: z.string() })).optional() }).optional(),
    }).passthrough()).optional(),
  }).optional(),
});

export type Article = {
  id: number; slug: string; title: string; summary: string; body: string;
  image: string | null; imageAlt: string; author: string; date: string;
  modified: string; sourceUrl: string; featured: boolean; readingMinutes: number; category: string;
};

export function plainText(html: string) {
  return decode(sanitizeHtml(html.replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote|figcaption|figure|td|th|tr|table)>|<br\s*\/?>/gi, ' '), {
    allowedTags: [], allowedAttributes: {},
  })).replace(/\s+/g, ' ').trim();
}

export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

const linksImage = (href: string) => /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(href);

function labelEmptyLinks(html: string) {
  return html.replace(/<a ([^>]*)>([\s\S]*?)<\/a>/g, (link, attrs: string, inner: string) => {
    if (plainText(inner) || /\salt="[^"]*[^"\s]/.test(inner) || /(^|\s)(aria-label|title)="[^"]*[^"\s]/.test(attrs)) return link;
    const href = decode(/href="([^"]*)"/.exec(attrs)?.[1] || '');
    return `<a ${attrs} aria-label="${linksImage(href) ? 'View full-size image' : 'Open linked page'}">${inner}</a>`;
  });
}

export function cleanBody(html: string) {
  return labelEmptyLinks(sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub'],
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'], th: ['scope'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } }),
    },
  }));
}

export function summarize(excerpt: string, body: string, custom?: unknown) {
  const editorial = typeof custom === 'string' ? plainText(custom) : '';
  if (editorial) return editorial;
  const short = plainText(excerpt);
  const text = short.split(/\s+/).length >= 60 ? short : plainText(body);
  const words = text.split(/\s+/);
  if (words.length <= 90) return text;
  const clipped = words.slice(0, 90).join(' ');
  const end = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('। '), clipped.lastIndexOf('? '));
  return end > clipped.length * .65 ? clipped.slice(0, end + 1) : clipped + '…';
}

export function normalizeArticle(value: unknown): Article {
  const post = postSchema.parse(value);
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  const image = media?.media_details?.sizes?.large?.source_url || media?.source_url;
  const categories = post._embedded?.['wp:term']?.flat().filter(term => term.taxonomy === 'category') || [];
  const primary = Number(post.meta?._yoast_wpseo_primary_category);
  const category = categories.find(term => term.id === primary)
    || categories.find(term => !['news', 'featured', 'uncategorized'].includes(term.slug))
    || categories[0];
  return {
    id: post.id, slug: post.slug, title: plainText(post.title.rendered),
    category: category?.slug || 'news',
    summary: summarize(post.excerpt.rendered, post.content.rendered, post.meta?.news_summary),
    body: cleanBody(pageSafeUploads(post.content.rendered)), image: safeUrl(image && fromLegacyUploads(image)),
    imageAlt: plainText(media?.alt_text || post.title.rendered),
    author: plainText(post._embedded?.author?.[0]?.name || 'Pratirodh Bureau'),
    date: post.date_gmt.endsWith('Z') ? post.date_gmt : post.date_gmt + 'Z',
    modified: post.modified_gmt.endsWith('Z') ? post.modified_gmt : post.modified_gmt + 'Z',
    sourceUrl: safeUrl(post.link) || 'http://www.pratirodh.com', featured: post.sticky || false,
    readingMinutes: Math.max(1, Math.ceil(plainText(post.content.rendered).split(/\s+/).length / 200)),
  };
}

