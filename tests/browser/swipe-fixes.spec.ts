import { test, expect } from '@playwright/test';
import { decode } from 'he';

test('header aligns left with mobile navigation, the indicator is gone, and refresh retains reader mode', async ({ page, request }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.feed-window')).toBeVisible();
  await expect(page.locator('.chapter-progress')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Jump to story/ })).toHaveCount(0);
  const logo = await page.locator('.official-wordmark').boundingBox();
  expect(logo!.x).toBeLessThan(page.viewportSize()!.width * .06);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  if (testInfo.project.name === 'mobile') {
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveText(['The Daily Brief', 'Saved Stories', 'About Us']);
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.mouse.click(8, 300);
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await nav.getByRole('link', { name: 'Saved Stories' }).click();
    await expect(page).toHaveURL(/\/saved\/$/);
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await nav.getByRole('link', { name: 'The Daily Brief' }).click();
    await expect(page.locator('.feed-window')).toBeVisible();
    await expect(nav).toBeHidden();
  } else {
    expect((await nav.boundingBox())!.x).toBeGreaterThan(logo!.x + logo!.width);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  }
  const controls = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools');
  const beforeScroll = await page.evaluate(() => scrollY);
  await controls.getByRole('button', { name: 'Next story' }).click();
  await expect(page.locator('.brief-counter strong')).toHaveText('02');
  expect(await page.evaluate(() => scrollY)).toBe(beforeScroll);
  const title = await page.locator('.story-card .story-copy > h2').nth(1).innerText();
  const followingTitle = await page.locator('.story-card .story-copy > h2').nth(2).innerText();
  const fullPath = await page.locator('.story-card .read-story').nth(1).getAttribute('href');
  const readerUrl = page.url();
  expect(new URL(readerUrl).pathname.replace(/\/$/, '')).toBe(`/brief${fullPath}`.replace(/\/$/, ''));
  await page.screenshot({ path: `test-results/${testInfo.project.name}-swipe-fixed.png` });
  await page.reload();
  await expect(page.locator('.feed-window')).toBeVisible();
  await expect(page.locator('.story-card[data-active="true"] .story-copy > h2')).toHaveText(title);
  await expect(page.locator('.brief-counter strong')).toHaveText('02');
  await expect(page.locator('.article-page')).toHaveCount(0);
  await expect(page).toHaveTitle(`${title} | Pratirodh`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(fullPath! + '$'));
  const html = await (await request.get(readerUrl, { headers: { 'user-agent': 'Twitterbot/1.0' } })).text();
  expect(decode(html.split('</head>')[0].match(/<title>([^<]*)<\/title>/)?.[1] || '')).toBe(`${title} | Pratirodh`);
  expect(html).toContain('id="active-story-structured-data"');
  await controls.getByRole('button', { name: 'Next story' }).click();
  await expect(page.locator('.brief-counter strong')).toHaveText('03');
  await expect(page.locator('.story-card[data-active="true"] .story-copy > h2')).toHaveText(followingTitle);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'About Us', exact: true }).click();
  await expect(page).toHaveTitle('About Us | Pratirodh');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
  await expect(page.locator('#active-story-structured-data')).toHaveCount(0);
});

test('one long gesture moves one story, summary scrolling stays local, and loading never advances the reader', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.story-card')).toHaveCount(20);
  const counter = page.locator('.brief-counter strong');
  await expect(counter).toHaveText('01');
  await page.waitForTimeout(900);
  await expect(counter).toHaveText('01');
  const initialWindowScroll = await page.evaluate(() => scrollY);
  if (testInfo.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    const summary = page.locator('.story-summary').first();
    const canScroll = await summary.evaluate(el => el.scrollHeight > el.clientHeight + 2);
    if (canScroll) {
      const box = await summary.boundingBox();
      await session.send('Input.synthesizeScrollGesture', { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2, yDistance: -380, speed: 900, gestureSourceType: 'touch' });
      await expect(counter).toHaveText('01');
      expect(await summary.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    }
    const image = await page.locator('.story-image').first().boundingBox();
    await session.send('Input.synthesizeScrollGesture', { x: image!.x + image!.width / 2, y: image!.y + image!.height / 2, yDistance: -380, speed: 900, gestureSourceType: 'touch' });
    await session.detach();
  } else {
    await page.locator('.story-image').first().hover();
    // A trackpad's momentum tail can last longer than the old fixed 650ms lock.
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(80); }
  }
  await expect(counter).toHaveText('02');
  await page.waitForTimeout(750);
  await expect(counter).toHaveText('02');
  expect(await page.evaluate(() => scrollY)).toBe(initialWindowScroll);
  await expect(page.locator('.feed-window')).toHaveAttribute('data-scrolling', 'false');
  await page.route('**/api/news?page=2', async route => {
    // Deterministic pagination response; no live CMS dependency for gesture QA.
    const fixture = await page.locator('.story-card h2 a').first().innerText();
    await route.fulfill({ json: { page: 2, totalPages: 2, total: 21, articles: [{ id: 999999, slug: 'gesture-fixture', category: 'news', title: fixture, summary: 'Pagination test fixture.', body: '', image: null, imageAlt: '', author: 'Test fixture', date: '2026-10-30T00:00:00Z', modified: '2026-10-30T00:00:00Z', sourceUrl: 'http://www.pratirodh.com', featured: false, readingMinutes: 1 }] } });
  });
  await page.locator('.feed-window').evaluate(el => el.scrollTo({ top: el.clientHeight * 17, behavior: 'instant' }));
  await expect(counter).toHaveText('18');
  await expect(page.locator('.story-card')).toHaveCount(21);
  await page.waitForTimeout(700);
  await expect(counter).toHaveText('18');
});

test('full story is distinct from the reader and all detail images are lazy', async ({ page }, testInfo) => {
  await page.goto('/');
  const fullPath = await page.locator('.story-card .read-story').first().getAttribute('href');
  const title = await page.locator('.story-card h2').first().innerText();
  expect(new URL(page.url()).pathname).toContain('/brief/');
  await page.locator('.story-card .read-story').first().click();
  await expect(page.locator('.article-page h1')).toHaveText(title, { timeout: 45000 });
  expect(new URL(page.url()).pathname.replace(/\/$/, '')).toBe(fullPath!.replace(/\/$/, ''));
  const images = page.locator('.article-hero img, .article-body img');
  expect(await images.count()).toBeGreaterThan(0);
  for (const image of await images.all()) await expect(image).toHaveAttribute('loading', 'lazy');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-detail-lazy.png` });
  await page.reload();
  await expect(page.locator('.article-page h1')).toHaveText(title);
  await page.getByRole('link', { name: 'Back to your brief' }).click();
  await expect(page.locator('.feed-window')).toBeVisible();
  await expect(page.locator('.story-card h2').first()).toHaveText(title);
  expect(new URL(page.url()).pathname).toContain('/brief/');
});

test('rapid fresh inputs advance every story without waiting for the previous transition', async ({ page }, testInfo) => {
  await page.goto('/');
  const root = page.locator('.feed-window');
  const counter = page.locator('.brief-counter strong');
  await expect(counter).toHaveText('01');
  await expect(page.locator('.story-card').nth(2).locator('img')).toHaveAttribute('loading', 'eager');
  if (testInfo.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    const box = await root.boundingBox();
    const x = box!.x + 35;
    const y = box!.y + 100;
    // Three separate finger releases arrive before a native smooth scroll would finish.
    for (let index = 0; index < 3; index++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 60 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(counter).toHaveText(String(index + 2).padStart(2, '0'));
    }
    await session.detach();
  } else {
    const next = page.locator('.reader-tools').getByRole('button', { name: 'Next story' });
    await next.click();
    await expect(root).toHaveAttribute('data-scrolling', 'true');
    await next.click();
    await next.click();
  }
  await expect(counter).toHaveText('04');
  await expect(root).toHaveAttribute('data-scrolling', 'false', { timeout: 500 });
  const geometry = await root.evaluate(el => ({ index: el.scrollTop / el.clientHeight, snap: getComputedStyle(el).scrollSnapType }));
  expect(geometry.index).toBeCloseTo(3, 2);
  expect(geometry.snap).toBe('y mandatory');
  const title = await page.locator('.story-card').nth(3).locator('.story-copy > h2').innerText();
  await expect(page).toHaveTitle(`${title} | Pratirodh`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp((await page.locator('.story-card .read-story').nth(3).getAttribute('href'))! + '$'));
  const previous = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools').getByRole('button', { name: 'Previous story' });
  await previous.click();
  await previous.click();
  await expect(counter).toHaveText('02');
  await expect(root).toHaveAttribute('data-scrolling', 'false');
  await expect.poll(() => root.evaluate(el => el.scrollTop / el.clientHeight)).toBeCloseTo(1, 2);
  await page.waitForTimeout(300);
  await expect(counter).toHaveText('02');
  if (testInfo.project.name === 'desktop') {
    await page.locator('.story-image').nth(1).hover();
    await page.mouse.wheel(0, 80);
    await page.waitForTimeout(220);
    await page.mouse.wheel(0, 80);
    await expect(counter).toHaveText('04');
    await expect(root).toHaveAttribute('data-scrolling', 'false', { timeout: 500 });
  }
});
