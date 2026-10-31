import test from 'node:test';
import assert from 'node:assert/strict';

process.env.WORDPRESS_API_URL = 'https://cms.pratirodh.com/wp-json/wp/v2';
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.pratirodh.com';

test('legacy upload URLs move to the CMS host while the site keeps the main domain', async () => {
  const { cmsOrigin, cmsSeparate, fromLegacyUploads } = await import('../src/lib/site');
  const { normalizeArticle } = await import('../src/lib/content');
  assert.equal(cmsOrigin, 'https://cms.pratirodh.com');
  assert.equal(cmsSeparate, true);
  assert.equal(fromLegacyUploads('http://www.pratirodh.com/wp-content/uploads/a.jpg https://pratirodh.com/wp-content/uploads/b.jpg https://example.com/wp-content/c.jpg'),
    'https://cms.pratirodh.com/wp-content/uploads/a.jpg https://cms.pratirodh.com/wp-content/uploads/b.jpg https://example.com/wp-content/c.jpg');
  const article = normalizeArticle({ id: 3, slug: 'legacy', title: { rendered: 'Legacy' }, content: { rendered: '<p><img src="http://www.pratirodh.com/wp-content/uploads/2020/01/x.jpg" alt="x"></p>' }, excerpt: { rendered: '' }, date_gmt: '2026-10-30T07:24:03', modified_gmt: '2026-10-30T07:24:03', link: 'https://cms.pratirodh.com/news/legacy/', _embedded: { 'wp:featuredmedia': [{ source_url: 'http://www.pratirodh.com/wp-content/uploads/2020/01/hero.jpg' }] } });
  assert.match(article.body, /src="https:\/\/cms\.pratirodh\.com\/wp-content\/uploads\/2020\/01\/x\.jpg"/);
  assert.equal(article.image, 'https://cms.pratirodh.com/wp-content/uploads/2020/01/hero.jpg');
});
