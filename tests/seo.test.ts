import test from 'node:test';
import assert from 'node:assert/strict';
import { plainText, type Article } from '../src/lib/content';
import { articleMetadata, articleSeo, articleStructuredData, structuredDataJson } from '../src/lib/article-seo';

const article: Article = {
  id: 1, slug: 'original-report', category: 'politics-society', title: 'A < B & "quoted" headline',
  summary: 'The original editorial summary.', body: '<p>The original report.</p>',
  image: 'https://example.com/photo.jpg', imageAlt: 'Original photo', author: 'Pratirodh Bureau',
  date: '2026-10-30T07:24:03Z', modified: '2026-10-30T07:29:01Z',
  sourceUrl: 'https://example.com/original-report/', featured: false, readingMinutes: 1,
};
test('article metadata and structured data share the canonical article identity', () => {
  const seo = articleSeo(article);
  const metadata = articleMetadata(article);
  const schema = articleStructuredData(article);
  assert.match(seo.url, /\/politics-society\/original-report\/$/);
  assert.deepEqual(metadata.title, { absolute: `${article.title} | Pratirodh` });
  assert.equal(metadata.alternates?.canonical, seo.url);
  assert.equal(schema.mainEntityOfPage['@id'], seo.url);
  assert.equal(schema.url, seo.url);
  assert.equal(schema.datePublished, article.date);
  assert.equal(schema.dateModified, article.modified);
  assert.equal(schema.author[0].name, article.author);
  assert.equal(schema.description, seo.description);
  const serialized = structuredDataJson(article);
  assert.ok(!serialized.includes('<'));
  assert.equal(JSON.parse(serialized).headline, article.title);
});
test('articles without images do not inherit another story’s social image', () => {
  const noImage = { ...article, image: null };
  const seo = articleSeo(noImage);
  const metadata = articleMetadata(noImage);
  assert.equal(seo.card, 'summary');
  assert.deepEqual(metadata.openGraph?.images, []);
  assert.deepEqual(metadata.twitter?.images, []);
  assert.ok(!('image' in articleStructuredData(noImage)));
});
test('detail schema contains the complete readable article body with safe JSON serialization', () => {
  const paragraphs = Array.from({ length: 30 }, (_, index) => `Full paragraph ${index + 1} with original reporting.`);
  const fullArticle = { ...article, body: paragraphs.map(text => `<p>${text}</p>`).join('') + '<ul><li>First point</li><li>Second point</li></ul><table><tr><td>India</td><td>भारत</td></tr></table><p>Final words &amp; &lt;/script&gt;.</p>' };
  const json = structuredDataJson(fullArticle, plainText(fullArticle.body));
  const schema = JSON.parse(json);
  assert.equal(schema['@type'], 'NewsArticle');
  assert.equal(schema.articleBody, paragraphs.join(' ') + ' First point Second point India भारत Final words & </script>.');
  assert.ok(!json.includes('<'));
  assert.equal(schema.description, article.summary);
  assert.ok(!('articleBody' in articleStructuredData(article)));
});
