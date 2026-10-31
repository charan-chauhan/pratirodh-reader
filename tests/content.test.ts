import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBody, normalizeArticle, plainText, safeUrl, summarize } from '../src/lib/content';
import { articlePath } from '../src/lib/paths';

test('WordPress HTML is decoded without exposing active content', () => {
  assert.equal(plainText('<p>हिंदी &amp; news&#8217;s</p><script>alert(1)</script>'), 'हिंदी & news’s');
  const html = cleanBody('<p onclick="steal()">News</p><script>steal()</script><iframe src="https://evil.test"></iframe><a href="javascript:steal()">Link</a><img src="https://example.com/a.jpg" onerror="steal()">');
  assert.doesNotMatch(html, /script|onclick|onerror|iframe|javascript:/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /noopener noreferrer/);
});
test('links without discernible text get an accessible name', () => {
  const html = cleanBody('<a href="http://www.pratirodh.com/wp-content/uploads/2026/10/flood.jpg"><img src="http://www.pratirodh.com/wp-content/uploads/2026/10/flood-300x200.jpg" alt=""></a><a href="https://example.com/report"><img src="https://example.com/x.png"></a><a href="https://example.com/a.jpg"><img src="https://example.com/a.jpg" alt="Flooded street"></a><a href="https://example.com/text">Report</a><a href="https://example.com/t" title="Source"><img src="https://example.com/t.png" alt=""></a>');
  assert.equal((html.match(/aria-label=/g) || []).length, 2);
  assert.match(html, /flood\.jpg" rel="noopener noreferrer" aria-label="View full-size image">/);
  assert.match(html, /report" rel="noopener noreferrer" aria-label="Open linked page">/);
  assert.match(html, />Report<\/a>/);
});
test('summary falls back to verbatim body text for short auto excerpts', () => {
  const body = Array.from({ length: 120 }, (_, i) => `word${i}`).join(' ');
  const summary = summarize('An automated short excerpt…', `<p>${body}</p>`);
  assert.equal(summary, body.split(' ').slice(0, 90).join(' ') + '…');
  assert.equal(summarize('excerpt', body, '<p>Approved editorial summary.</p>'), 'Approved editorial summary.');
});
test('unsafe media schemes and embedded credentials are rejected', () => {
  for (const value of ['javascript:alert(1)', 'data:image/svg+xml,x', 'https://user:pass@example.com', '/relative', null]) assert.equal(safeUrl(value), null);
  assert.equal(safeUrl('https://example.com/image.jpg'), 'https://example.com/image.jpg');
});
test('validates the CMS schema, keeps original facts and normalizes UTC dates', () => {
  const article = normalizeArticle({ id: 2, slug: 'original-slug', title: { rendered: 'Original &amp; headline' }, content: { rendered: '<p>Original report.</p>' }, excerpt: { rendered: '' }, date_gmt: '2026-10-30T07:24:03', modified_gmt: '2026-10-30T07:29:01', link: 'http://www.pratirodh.com/news/original-slug/' });
  assert.equal(article.title, 'Original & headline');
  assert.equal(article.summary, 'Original report.');
  assert.equal(article.date, '2026-10-30T07:24:03Z');
  assert.equal(article.image, null);
  assert.equal(article.author, 'Pratirodh Bureau');
  assert.throws(() => normalizeArticle({ id: 'not-a-number' }));
});
test('category URLs prefer an exposed primary category, then a specific category over Featured', () => {
  const post = { id: 2, slug: 'a-story', title: { rendered: 'Headline' }, content: { rendered: '<p>Report.</p>' }, excerpt: { rendered: '' }, date_gmt: '2026-10-30T07:24:03', modified_gmt: '2026-10-30T07:29:01', link: 'http://www.pratirodh.com/news/a-story/', _embedded: { 'wp:term': [[{ id: 57, slug: 'news', taxonomy: 'category' }, { id: 637, slug: 'politics-society', taxonomy: 'category' }, { id: 7, slug: 'earth-and-ecology', taxonomy: 'category' }], [{ id: 100, slug: 'a-tag', taxonomy: 'post_tag' }]] } };
  const article = normalizeArticle(post);
  assert.equal(article.category, 'politics-society');
  assert.equal(articlePath(article.slug, article.category), '/politics-society/a-story/');
  assert.equal(normalizeArticle({ ...post, meta: { _yoast_wpseo_primary_category: '7' } }).category, 'earth-and-ecology');
  assert.equal(articlePath('हिंदी खबर', 'समाचार'), '/%E0%A4%B8%E0%A4%AE%E0%A4%BE%E0%A4%9A%E0%A4%BE%E0%A4%B0/%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A5%80%20%E0%A4%96%E0%A4%AC%E0%A4%B0/');
});
