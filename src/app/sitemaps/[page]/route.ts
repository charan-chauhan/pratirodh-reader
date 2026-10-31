import { getSitemapPage } from '@/lib/wordpress';
import { siteUrl, indexable } from '@/lib/site';
import { articlePath } from '@/lib/paths';
export const revalidate = 3600;
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const page = (await params).page;
  if (!/^[1-9]\d{0,3}\.xml$/.test(page)) return new Response('Not found', { status: 404 });
  const articles = indexable ? (await getSitemapPage(Number(page.replace('.xml', '')))).articles : [];
  const urls = articles.map(a => `<url><loc>${escape(siteUrl + articlePath(a.slug, a.category))}</loc><lastmod>${a.modified}</lastmod></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
