import { test, expect } from '@playwright/test';

test('newspaper home renders 20 stories, scrolls normally and opens refresh-safe full articles', async ({ page, request }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.news-home .news-card:not(.home-section .news-card)');
  await expect(cards).toHaveCount(20);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.feed-window, .reader-layout, #active-story-structured-data')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next story', exact: true })).toHaveCount(0);
  const title = await cards.first().locator('h2 > a').innerText();
  const href = await cards.first().locator('h2 > a').getAttribute('href');
  expect(href).toMatch(/^\/[^/]+\/[^/]+\/$/);
  expect(href).not.toContain('/brief/');
  const homeTitle = await page.title();
  await page.mouse.wheel(0, 700);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
  await expect(page).toHaveTitle(homeTitle);
  const html = await (await request.get('/')).text();
  expect(html).toContain(title.replaceAll('&', '&amp;').replaceAll('’', '’'));
  await cards.first().locator('h2 > a').click();
  await expect(page.locator('.article-heading h1')).toHaveText(title, { timeout: 45000 });
  await expect(page).toHaveURL(new RegExp(href! + '$'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.article-heading h1')).toHaveText(title);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-newspaper-article.png`, fullPage: true });
  await page.getByRole('link', { name: 'All Stories', exact: true }).first().click();
  await expect(page.locator('.news-home .news-card:not(.home-section .news-card)')).toHaveCount(20);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.news-home')).toBeVisible();
  await expect(page).toHaveTitle(homeTitle);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-newspaper-home.png`, fullPage: true });
});

test('manual pagination shows progress, retries failed requests and appends stories without changing the home URL', async ({ page, request }) => {
  const feed = await (await request.get('/api/news?page=1')).json();
  let attempts = 0;
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/news?page=2', async route => {
    attempts++;
    if (attempts === 1) { await route.fulfill({ status: 503, json: { error: 'Test-only unavailable response' } }); return; }
    await ready;
    await route.fulfill({ json: { articles: [{ ...feed.articles[0], id: 999990, slug: 'pagination-fixture', title: 'Pagination fixture', image: null }], page: 2, totalPages: 2, total: 21 } });
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Load More Stories', exact: true }).click();
    await expect(page.locator('.load-more-area [role=alert]')).toContainText('couldn’t be loaded');
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Loading Stories…', exact: true })).toBeDisabled();
    await expect(page.locator('.news-home .news-card:not(.home-section .news-card)')).toHaveCount(20);
    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    release();
    await expect(page.locator('.news-home .news-card:not(.home-section .news-card)')).toHaveCount(21);
    await expect(page.locator('.news-home .news-card:not(.home-section .news-card)').last()).toContainText('Pagination fixture');
    await expect(page.locator('.load-more-area')).toContainText('Showing 21');
    await expect(page.locator('.load-more-area').getByRole('link', { name: 'Explore the Full Archive' })).toBeVisible();
    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
  } finally { release(); }
});

test('bookmarks, reading history, sharing and mobile navigation survive the list redesign', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const first = page.locator('.news-home .news-card:not(.home-section .news-card)').first();
  const title = await first.locator('h2 > a').innerText();
  await first.getByRole('button', { name: 'Bookmark story', exact: true }).click();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Saved Stories' }).click();
  await expect(page.locator('.library-page .news-card')).toHaveCount(1);
  await expect(page.locator('.library-page .news-card h2 > a')).toHaveText(title);
  await page.locator('.library-page .news-card h2 > a').click();
  await expect(page.locator('.article-heading h1')).toHaveText(title);
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await page.locator('.article-action-group').getByRole('button', { name: 'Share story' }).click();
  await expect(page.getByRole('dialog', { name: 'Share this story' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Article link' })).toHaveValue(page.url());
  await page.getByRole('button', { name: 'Close sharing' }).click();
  await page.goto('/recent/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.library-page .news-card h2 > a')).toHaveText(title);
  await page.goto('/saved/', { waitUntil: 'domcontentloaded' });
  await page.locator('.library-page').getByRole('button', { name: 'Remove bookmark', exact: true }).click();
  await expect(page.locator('.library-page .news-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Good stories are worth keeping.' })).toBeVisible();
});

test('masthead, theme logos and About Us work at desktop and mobile sizes', async ({ page }, testInfo) => {
  await page.goto('/about-us/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('section[lang=hi]')).toContainText('प्रतिरोध डॉट कॉम');
  await expect(page.locator('.masthead .logo-light')).toBeVisible();
  const logo = await page.locator('.masthead .official-wordmark').boundingBox();
  expect(Math.abs(logo!.x + logo!.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(2);
  if (testInfo.project.name === 'mobile') {
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
  }
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('.masthead .logo-dark')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.masthead .logo-dark')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('category sections, swipe rows and section pages use real WordPress categories', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (const heading of ['Politics & Society', 'Earth and Ecology', 'World View', 'Arts and Aesthetics', 'The New Feudals']) {
    await expect(page.getByRole('heading', { level: 2, name: heading, exact: true })).toBeVisible();
  }
  await expect(page.locator('.latest-section').getByRole('heading', { name: 'Newswires' })).toHaveCount(0);
  const track = page.locator('.home-section-carousel .carousel-track');
  await track.scrollIntoViewIfNeeded();
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Next Earth and Ecology stories' }).click();
    await expect.poll(() => track.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.section-nav')).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('.menu-sections').getByRole('link', { name: 'World View', exact: true }).click();
  } else {
    await page.locator('.section-nav').getByRole('link', { name: 'World View', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/category\/world-view\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'World View' })).toBeVisible();
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/category\/world-view\/$/);
  await page.getByRole('link', { name: 'Older stories →' }).click();
  await expect(page).toHaveURL(/\/category\/world-view\/\?page=2$/);
  expect((await page.goto('/category/not-a-real-section/'))?.status()).toBe(404);
});
