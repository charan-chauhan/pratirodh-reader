import test from 'node:test';
import assert from 'node:assert/strict';

process.env.WORDPRESS_API_URL = 'http://cms.pratirodh.com/wp-json/wp/v2';
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.pratirodh.com';

test('an HTTP-only CMS serves article body uploads through the HTTPS site', async () => {
  const { pageSafeUploads } = await import('../src/lib/site');
  const { normalizeArticle } = await import('../src/lib/content');
  assert.equal(pageSafeUploads('<img src="http://cms.pratirodh.com/wp-content/uploads/n.jpg"><img src="https://www.pratirodh.com/wp-content/uploads/o.jpg">'),
    '<img src="/wp-content/uploads/n.jpg"><img src="/wp-content/uploads/o.jpg">');
  const article = normalizeArticle({ id: 4, slug: 'http-cms', title: { rendered: 'HTTP CMS' }, content: { rendered: '<p><a href="http://www.pratirodh.com/wp-content/uploads/2020/01/x.jpg"><img src="http://www.pratirodh.com/wp-content/uploads/2020/01/x-300x200.jpg" alt=""></a></p>' }, excerpt: { rendered: '' }, date_gmt: '2026-10-30T07:24:03', modified_gmt: '2026-10-30T07:24:03', link: 'http://cms.pratirodh.com/news/http-cms/', _embedded: { 'wp:featuredmedia': [{ source_url: 'http://www.pratirodh.com/wp-content/uploads/2020/01/hero.jpg' }] } });
  assert.match(article.body, /<a href="\/wp-content\/uploads\/2020\/01\/x\.jpg" rel="noopener noreferrer" aria-label="View full-size image"><img src="\/wp-content\/uploads\/2020\/01\/x-300x200\.jpg"/);
  assert.doesNotMatch(article.body, /http:\/\//);
  assert.equal(article.image, 'http://cms.pratirodh.com/wp-content/uploads/2020/01/hero.jpg');
  const { articleSeo } = await import('../src/lib/article-seo');
  assert.equal(articleSeo(article).image, 'https://www.pratirodh.com/wp-content/uploads/2020/01/hero.jpg');
});
