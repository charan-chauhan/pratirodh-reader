import { getSitemapPage } from '@/lib/wordpress';
import { siteUrl, indexable } from '@/lib/site';
import { articlePath } from '@/lib/paths';
export const revalidate = 300;
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
export async function GET() {
  const articles = [];
  if (indexable) {
    for (let page = 1; page <= 10; page++) {
      const feed = await getSitemapPage(page);
      const recent = feed.articles.filter(a => Date.now() - Date.parse(a.date) < 48 * 3600 * 1000);
      articles.push(...recent);
      if (recent.length < feed.articles.length || page >= feed.totalPages) break;
    }
  }
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${articles.map(a => `<url><loc>${escape(siteUrl + articlePath(a.slug, a.category))}</loc><news:news><news:publication><news:name>Pratirodh</news:name><news:language>en</news:language></news:publication><news:publication_date>${a.date}</news:publication_date><news:title>${escape(a.title)}</news:title></news:news></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
