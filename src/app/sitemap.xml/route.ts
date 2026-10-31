import { getPublishedTotal } from '@/lib/wordpress';
import { siteUrl, indexable } from '@/lib/site';
export const revalidate = 3600;
export async function GET() {
  const total = indexable ? await getPublishedTotal() : 0;
  const count = indexable ? Math.ceil(total / 100) : 0;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({ length: count }, (_, i) => `<sitemap><loc>${siteUrl.replace(/&/g, '&amp;')}/sitemaps/${i + 1}.xml</loc></sitemap>`).join('')}</sitemapindex>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
