import { test, expect, type Page } from '@playwright/test';
import { decode } from 'he';
import { plainText, type Article } from '../../src/lib/content';
import { articleSeo, structuredDataJson } from '../../src/lib/article-seo';
import { articlePath } from '../../src/lib/paths';

async function expectSeo(page: Page, article: Article) {
  const seo = articleSeo(article);
  await expect(page).toHaveTitle(seo.title);
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', seo.url);
  const tags: Record<string, string> = {
    'name="description"': seo.description, 'name="author"': article.author,
    'property="og:title"': article.title, 'property="og:description"': seo.description,
    'property="og:url"': seo.url, 'property="og:type"': 'article',
    'property="article:published_time"': article.date, 'property="article:modified_time"': article.modified,
    'property="article:author"': article.author, 'property="article:section"': seo.section,
    'name="twitter:title"': article.title, 'name="twitter:description"': seo.description,
    'name="twitter:card"': seo.card,
  };
  for (const [selector, value] of Object.entries(tags)) {
    const tag = page.locator(`head meta[${selector}]`);
    await expect(tag).toHaveCount(1); await expect(tag).toHaveAttribute('content', value);
  }
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const image = page.locator(`head ${selector}`);
    await expect(image).toHaveCount(article.image ? 1 : 0);
    if (article.image) await expect(image).toHaveAttribute('content', article.image);
  }
  await expect.poll(() => page.locator('#active-story-structured-data').textContent()).toBe(structuredDataJson(article));
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', /noindex/);
}

test('each active story owns its head metadata and matches server-rendered article SEO', async ({ page, request }, testInfo) => {
  await page.goto('/');
  const feed = await (await request.get('/api/news?page=1')).json();
  await expectSeo(page, feed.articles[0]);
  const nav = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools');
  await nav.getByRole('button', { name: 'Next story' }).click();
  await expectSeo(page, feed.articles[1]);
  await nav.getByRole('button', { name: 'Previous story' }).click();
  await expectSeo(page, feed.articles[0]);

  // Social crawlers receive complete metadata in the server response, without swiping or JavaScript.
  const article = feed.articles[1];
  const response = await request.get(articlePath(article.slug, article.category), { headers: { 'user-agent': 'Twitterbot/1.0' } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  const head = html.split('</head>')[0];
  expect(decode(head.match(/<title>([^<]*)<\/title>/)?.[1] || '')).toBe(articleSeo(article).title);
  expect(head).toContain('property="og:type" content="article"');
  expect(head).toContain(articleSeo(article).url);
  const fullArticle: Article = (await (await request.get(`/api/news?slug=${encodeURIComponent(article.slug)}`)).json()).article;
  const fullBody = plainText(fullArticle.body);
  expect(fullBody.length).toBeGreaterThan(article.summary.length);
  expect(html).toContain(structuredDataJson(fullArticle, fullBody));
  await page.goto(articlePath(article.slug, article.category));
  await expect(page).toHaveTitle(articleSeo(article).title);
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', articleSeo(article).url);
  await expect(page.locator('#active-story-structured-data')).toHaveCount(0);
  const detailSchema = JSON.parse((await page.locator('.article-page > script[type="application/ld+json"]').textContent())!);
  expect(detailSchema['@type']).toBe('NewsArticle');
  expect(detailSchema.articleBody).toBe(fullBody);
});

test('newly loaded stories clear stale images and leaving the swiper restores page metadata', async ({ page, request }, testInfo) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const noImage: Article = { ...feed.articles[0], id: 999999, slug: 'seo-no-image-fixture', category: 'news', image: null };
  await page.route('**/api/news?page=2', route => route.fulfill({ json: { articles: [noImage], page: 2, totalPages: 2, total: 21 } }));
  await page.goto('/');
  await expectSeo(page, feed.articles[0]);
  await page.locator('.feed-window').evaluate(el => el.scrollTo({ top: el.clientHeight * 17, behavior: 'instant' }));
  await expect(page.locator('.story-card')).toHaveCount(21);
  await page.locator('.feed-window').evaluate(el => el.scrollTo({ top: el.clientHeight * 20, behavior: 'instant' }));
  await expectSeo(page, noImage);
  await expect(page.locator('head meta[property="og:image:alt"]')).toHaveCount(0);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'About Us', exact: true }).click();
  await expect(page).toHaveTitle('About Us | Pratirodh');
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/about-us\/$/);
  await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('head meta[property="article:published_time"]')).toHaveCount(0);
  await expect(page.locator('#active-story-structured-data')).toHaveCount(0);
});
