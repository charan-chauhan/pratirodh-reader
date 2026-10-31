import { test, expect } from '@playwright/test';
import { decode } from 'he';
import { plainText, type Article } from '../../src/lib/content';
import { articleSeo, structuredDataJson } from '../../src/lib/article-seo';
import { articlePath } from '../../src/lib/paths';

test('home keeps its own SEO while each full article exposes metadata and its complete body in server JSON-LD', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const homeTitle = await page.title();
  const canonical = await page.locator('head link[rel=canonical]').getAttribute('href');
  await page.mouse.wheel(0, 900);
  await expect(page).toHaveTitle(homeTitle);
  await expect(page.locator('head link[rel=canonical]')).toHaveAttribute('href', canonical!);
  await expect(page.locator('#active-story-structured-data')).toHaveCount(0);
  const feed = await (await request.get('/api/news?page=1')).json();
  const selected: Article = feed.articles[0];
  const response = await request.get(articlePath(selected.slug, selected.category), { headers: { 'user-agent': 'Twitterbot/1.0' } });
  expect(response.status()).toBe(200);
  const html = await response.text();
  const article: Article = (await (await request.get(`/api/news?slug=${encodeURIComponent(selected.slug)}`)).json()).article;
  const fullBody = plainText(article.body);
  expect(fullBody.length).toBeGreaterThan(article.summary.length);
  expect(html).toContain(structuredDataJson(article, fullBody));
  const title = html.split('</head>')[0].match(/<title>([^<]*)<\/title>/)?.[1];
  expect(decode(title || '')).toBe(articleSeo(article).title);
  await page.goto(articlePath(article.slug, article.category), { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(articleSeo(article).title);
  await expect(page.locator('head link[rel=canonical]')).toHaveAttribute('href', articleSeo(article).url);
  await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute('content', 'article');
  const schema = JSON.parse((await page.locator('.article-page > script[type="application/ld+json"]').textContent())!);
  expect(schema.articleBody).toBe(fullBody);
  for (const image of await page.locator('.article-hero img,.article-body img').all()) await expect(image).toHaveAttribute('loading', 'lazy');
});

test('old brief URLs redirect permanently to the full category article', async ({ request }) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const article = feed.articles[0];
  const path = articlePath(article.slug, article.category);
  const response = await request.get(`/brief${path}`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe(path);
});
