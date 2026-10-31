import { test, expect } from '@playwright/test';
// Multi-page checks use the live WordPress host, including cold uncached requests.
test.setTimeout(120000);

test('live feed renders real content, navigates, saves, shares and opens full articles', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  const cards = page.locator('.story-card');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().locator('.story-copy > h2')).not.toBeEmpty();
  const firstTitle = await cards.first().locator('.story-copy > h2').innerText();
  const firstPath = await cards.first().locator('.story-copy > h2 a').getAttribute('href');
  await expect(page).toHaveURL(new RegExp('/brief' + firstPath!.replace(/\/$/, '') + '/?$'));
  expect(new URL(page.url()).search).toBe('');
  await expect(page.locator('.official-wordmark img')).toHaveAttribute('src', /pratirodh-logo/);
  await expect(page.locator('.feed-heading')).toContainText('01');
  await page.screenshot({ path: `test-results/${testInfo.project.name}-feed.png`, fullPage: true });
  const nav = testInfo.project.name === 'mobile' ? page.locator('.mobile-navigation') : page.locator('.reader-tools');
  await nav.getByRole('button', { name: 'Next story' }).click();
  await expect(page.locator('.feed-heading')).toContainText('02');
  await nav.getByRole('button', { name: 'Previous story' }).click();
  await expect(page.locator('.feed-heading')).toContainText('01');
  await cards.first().getByRole('button', { name: 'Bookmark story', exact: true }).click();
  await expect(cards.first().getByRole('button', { name: 'Remove bookmark' })).toHaveAttribute('aria-pressed', 'true');
  // Force the browser share-sheet fallback so all social links can be checked.
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await cards.first().getByRole('button', { name: 'Share story' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', /wa\.me/);
  await expect(page.getByRole('dialog').getByRole('link')).toHaveCount(5);
  await page.getByRole('button', { name: 'Close sharing' }).click();
  await page.getByRole('button', { name: /Switch to .* mode/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await cards.first().getByRole('link', { name: /Read Full Story/ }).click();
  await expect(page.locator('.article-page h1')).toHaveText(firstTitle);
  await expect(page.locator('.article-body p').first()).toBeVisible();
  const imageWidths = await page.locator('.article-body img, .article-hero img').evaluateAll(images => images.map(image => ({ width: image.getBoundingClientRect().width, container: image.parentElement!.getBoundingClientRect().width })));
  for (const image of imageWidths) expect(Math.abs(image.width - image.container)).toBeLessThan(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(firstPath! + '$'));
  const slug = firstPath!.split('/').filter(Boolean).at(-1);
  const legacy = await page.request.get(`/news/${slug}/`, { maxRedirects: 0 });
  if (!firstPath!.startsWith('/news/')) {
    expect(legacy.status()).toBe(308);
    expect(legacy.headers().location).toBe(firstPath);
  }
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema || '{}')['@type']).toBe('NewsArticle');
  await page.goto('/saved/');
  await expect(page.locator('.story-card .story-copy > h2').first()).toHaveText(firstTitle, { timeout: 45000 });
  await page.reload();
  await expect(page.locator('.story-card .story-copy > h2').first()).toHaveText(firstTitle, { timeout: 45000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.locator('.story-card').first().getByRole('button', { name: 'Remove bookmark' }).click();
  await expect(page.getByRole('heading', { name: 'A little space for good stories.' })).toBeVisible();
  await page.goto('/recent/');
  await expect(page.locator('.story-card').first()).toBeVisible({ timeout: 45000 });
});

test('scroll snapping, keyboard navigation, pagination and restoration work', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.story-card').first()).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await page.locator('.feed-window').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.feed-heading')).toContainText('02');
    await page.locator('.story-image').nth(1).hover();
    await page.mouse.wheel(0, 600);
    await expect(page.locator('.feed-heading')).not.toContainText('02 /');
  }
  await page.locator('.feed-window').evaluate(el => el.scrollTo({ top: el.clientHeight * 17, behavior: 'instant' }));
  await expect(page.locator('.story-card')).toHaveCount(40, { timeout: 45000 });
  const slugs = await page.locator('.story-card h2 a').evaluateAll(links => links.map(a => a.getAttribute('href')));
  expect(new Set(slugs).size).toBe(slugs.length);
  await page.locator('.feed-window').evaluate(el => el.scrollTo({ top: el.clientHeight * 21, behavior: 'instant' }));
  await expect(page.locator('.feed-heading')).toContainText('22');
  const selectedTitle = await page.locator('.story-card .story-copy > h2').nth(21).innerText();
  await page.reload();
  await expect(page.locator('.story-card .story-copy > h2').first()).toHaveText(selectedTitle, { timeout: 45000 });
  await page.locator('.story-card').first().getByRole('link', { name: 'Read Full Story' }).click();
  await expect(page.locator('.article-page h1')).toHaveText(selectedTitle, { timeout: 45000 });
  await page.getByRole('link', { name: 'Back to your brief' }).click();
  await expect(page.locator('.story-card .story-copy > h2').first()).toHaveText(selectedTitle, { timeout: 45000 });
});

test('About Us stays inside the app and includes both supplied languages', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'About Us', exact: true }).click();
  await expect(page).toHaveURL(/\/about-us\/?$/);
  await expect(page.getByRole('heading', { name: 'About Us', exact: true })).toBeVisible();
  await expect(page.locator('[lang="en"] #about-english')).toHaveText('Pratirodh.com : Putting People First.');
  await expect(page.locator('section[lang="hi"]')).toContainText('प्रतिरोध डॉट कॉमः हमारे बारे में-');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('touch swipes, rapid wheel input, viewport controls and reduced motion work', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.story-card').first()).toBeVisible();
  const navigation = page.locator(testInfo.project.name === 'mobile' ? '.mobile-navigation' : '.reader-tools');
  const nextBounds = await navigation.getByRole('button', { name: 'Next story' }).boundingBox();
  expect(nextBounds!.y + nextBounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
  const readBounds = await page.locator('.story-card').first().getByRole('link', { name: 'Read Full Story' }).boundingBox();
  expect(readBounds!.y + readBounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
  if (testInfo.project.name === 'mobile') {
    const image = await page.locator('.story-image').first().boundingBox();
    const session = await page.context().newCDPSession(page);
    await session.send('Input.synthesizeScrollGesture', { x: image!.x + image!.width / 2, y: image!.y + image!.height / 2, yDistance: -380, speed: 950, gestureSourceType: 'touch' });
    await session.detach();
  } else {
    await page.locator('.story-image').first().hover();
    for (let index = 0; index < 7; index++) await page.mouse.wheel(0, 200);
  }
  await expect(page.locator('.feed-heading .brief-counter strong')).toHaveText('02');
  expect(new URL(page.url()).search).toBe('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.story-surface').nth(1).evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await navigation.getByRole('button', { name: 'Previous story' }).click();
  await expect(page.locator('.feed-heading .brief-counter strong')).toHaveText('01');
});

test('API input, preview indexing and missing stories are handled safely', async ({ request }) => {
  expect((await request.get('/api/news?page=-1')).status()).toBe(400);
  expect((await request.get('/api/news?ids=nope')).status()).toBe(400);
  expect((await request.post('/api/revalidate')).status()).toBe(503);
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
  const home = await request.get('/');
  expect(home.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect((await request.get('/news/this-story-definitely-does-not-exist-8934729/')).status()).toBe(404);
});
