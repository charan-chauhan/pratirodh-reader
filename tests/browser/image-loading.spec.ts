import { test, expect } from '@playwright/test';

test('a slow image shows progress while the home page remains readable', async ({ page, request }) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const source = feed.articles[0].image;
  expect(source).toBeTruthy();
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.pathname.replace(/\/$/, '') === '/_next/image' && url.searchParams.get('url') === source, async route => {
    await ready;
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#ddd"/></svg>' });
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const first = page.locator('.news-home .news-card:not(.home-section .news-card)').first();
    const media = first.locator('.story-media');
    await expect(media).toHaveAttribute('aria-busy', 'true');
    await expect(media.getByText('Loading image…')).toBeVisible();
    await expect(first.locator('h2 > a')).toBeVisible();
    await first.getByRole('button', { name: 'Bookmark story', exact: true }).click();
    await expect(first.getByRole('button', { name: 'Remove bookmark', exact: true })).toHaveAttribute('aria-pressed', 'true');
    release();
    await expect(media).toHaveAttribute('data-state', 'ready');
    await expect(media).toHaveAttribute('aria-busy', 'false');
    await expect(media.locator('.image-loading')).toHaveCount(0);
  } finally { release(); }
});

test('missing and failed article images show a placeholder after manual pagination', async ({ page, request }, testInfo) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const base = feed.articles[0];
  const broken = 'http://www.pratirodh.com/wp-content/uploads/2026/10/test-missing-image.png';
  await page.route('**/api/news?page=2', route => route.fulfill({ json: { page: 2, totalPages: 2, total: 22, articles: [
    { ...base, id: 999990, slug: 'no-image-fixture', title: 'Missing image fixture', image: null },
    { ...base, id: 999991, slug: 'broken-image-fixture', title: 'Broken image fixture', image: broken },
  ] } }));
  await page.route(url => url.pathname.replace(/\/$/, '') === '/_next/image' && url.searchParams.get('url') === broken, route => route.fulfill({ status: 404, body: 'Image not found' }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Load More Stories', exact: true }).click();
  await expect(page.locator('.news-home .news-card:not(.home-section .news-card)')).toHaveCount(22);
  const cards = page.locator('.news-home .news-card:not(.home-section .news-card)');
  await cards.nth(20).scrollIntoViewIfNeeded();
  await expect(cards.nth(20).locator('.story-media')).toHaveAttribute('data-state', 'placeholder');
  await expect(cards.nth(20).getByText('Image unavailable')).toBeVisible();
  await cards.nth(21).scrollIntoViewIfNeeded();
  await expect(cards.nth(21).locator('.story-media')).toHaveAttribute('data-state', 'placeholder');
  await expect(cards.nth(21).locator('img')).toHaveAttribute('src', /\/placeholder\.svg$/);
  await expect(cards.nth(21).locator('.image-loading')).toHaveCount(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-newspaper-placeholder.png` });
});
