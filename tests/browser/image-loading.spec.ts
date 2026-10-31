import { test, expect } from '@playwright/test';

test('a slow image shows a loader, swiping remains responsive, and the loader clears after success', async ({ page, request }, testInfo) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const source = feed.articles[0].image;
  expect(source).toBeTruthy();
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.pathname.replace(/\/$/, '') === '/_next/image' && url.searchParams.get('url') === source, async route => {
    await ready;
    await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#ad3b32"/></svg>' });
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const media = page.locator('.story-card').first().locator('.story-media');
    await expect(media).toHaveAttribute('aria-busy', 'true');
    await expect(media.getByText('Loading image…')).toBeVisible();
    await expect(page.locator('.story-card').first().locator('h2 > a')).toBeVisible();
    const controls = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools');
    await controls.getByRole('button', { name: 'Next story' }).click();
    await expect(page.locator('.brief-counter strong')).toHaveText('02');
    await controls.getByRole('button', { name: 'Previous story' }).click();
    await expect(page.locator('.brief-counter strong')).toHaveText('01');
    release();
    await expect(media).toHaveAttribute('data-state', 'ready');
    await expect(media).toHaveAttribute('aria-busy', 'false');
    await expect(media.locator('.image-loading')).toHaveCount(0);
    expect(await media.locator('img').evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  } finally { release(); }
});

test('pagination waits for data without advancing, and missing or broken images show placeholders', async ({ page, request }, testInfo) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  const base = feed.articles[0];
  const broken = 'http://www.pratirodh.com/wp-content/uploads/2026/10/test-missing-image.png';
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/news?page=2', async route => {
    await ready;
    await route.fulfill({ json: { page: 2, totalPages: 2, total: 22, articles: [
      { ...base, id: 999990, slug: 'no-image-fixture', title: 'Missing image fixture', image: null },
      { ...base, id: 999991, slug: 'broken-image-fixture', title: 'Broken image fixture', image: broken },
    ] } });
  });
  await page.route(url => url.pathname.replace(/\/$/, '') === '/_next/image' && url.searchParams.get('url') === broken, route => route.fulfill({ status: 404, body: 'Image not found' }));
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const root = page.locator('.feed-window');
    const counter = page.locator('.brief-counter strong');
    await expect(page.locator('.story-card')).toHaveCount(20);
    await root.evaluate(el => el.scrollTo({ top: el.clientHeight * 19, behavior: 'instant' }));
    await expect(counter).toHaveText('20');
    await expect(page.locator('.reader-load-status')).toContainText('Loading more stories…');
    const next = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools').getByRole('button', { name: 'Next story' });
    await expect(next).toBeDisabled();
    await page.keyboard.press('ArrowDown');
    await expect(counter).toHaveText('20');
    await page.screenshot({ path: `test-results/${testInfo.project.name}-waiting-for-stories.png` });
    release();
    await expect(page.locator('.story-card')).toHaveCount(22);
    await expect(page.locator('.reader-load-status')).toHaveCount(0);
    await expect(next).toBeEnabled();
    await page.waitForTimeout(300);
    await expect(counter).toHaveText('20');
    await next.click();
    await expect(counter).toHaveText('21');
    const missing = page.locator('.story-card').nth(20).locator('.story-media');
    await expect(missing).toHaveAttribute('data-state', 'placeholder');
    await expect(missing.locator('img')).toHaveAttribute('src', /\/placeholder\.svg$/);
    await expect(missing.locator('.image-placeholder-label')).toBeVisible();
    await expect(missing.locator('.image-loading')).toHaveCount(0);
    await page.screenshot({ path: `test-results/${testInfo.project.name}-missing-image.png` });
    await next.click();
    await expect(counter).toHaveText('22');
    const failed = page.locator('.story-card').nth(21).locator('.story-media');
    await expect(failed).toHaveAttribute('data-state', 'placeholder');
    await expect(failed).toHaveAttribute('aria-busy', 'false');
    await expect(failed.locator('img')).toHaveAttribute('src', /\/placeholder\.svg$/);
    await expect(failed.locator('.image-loading')).toHaveCount(0);
    await expect(next).toBeDisabled();
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', broken);
  } finally { release(); }
});
