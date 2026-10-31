# Pratirodh Reader

A Next.js App Router frontend for the existing Pratirodh WordPress newsroom. WordPress remains the editorial source. No hosting, DNS, backup, or GitHub changes are part of this implementation.

## Local development

Requires Node.js 20.9 or newer (tested on Node 22).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. The default public read-only API is `http://www.pratirodh.com/wp-json/wp/v2`; no credentials are needed. Images use Next.js optimization. Update `images.remotePatterns` in `next.config.ts` if the media host changes.

```sh
npm test
npm run typecheck
npm run build
npm start
npm run test:e2e
```

WordPress authors, categories and media use batched lookups, avoiding per-story embedded subrequests. Validated results are cached for 60 seconds. Feed/search responses omit full article bodies; direct article pages still receive the complete sanitized content. A bounded per-process cache (200 articles / 8 MB, 60 seconds) reuses already-fetched content when opening a search result or viewing saved stories; WordPress remains the fallback.

Browser checks require Google Chrome and a local server on port 3000. They use desktop and mobile emulation, not physical devices. WordPress can take several seconds per uncached request. The build fetches initial public posts and requires network access.

## Reader design

The reader uses a warm paper and charcoal palette with a vermilion brand accent, a split photo/story layout on desktop, and compact cards on mobile. Controlled touch, wheel and keyboard gestures move one story at a time, with subtle depth and reduced-motion support. Wheel momentum cannot trigger a second navigation, and a gesture that starts scrolling a summary stays with that summary. The navigation dock includes an upcoming story preview and explicit previous/next controls; there is no autoplay or multi-part progress indicator. No animation library is required.

Story selection responds immediately with a 180ms transition. Fresh gestures and button presses can retarget an unfinished transition, so rapid input is retained. The two adjacent images in either direction load eagerly at normal priority; only the active image receives high priority. The next feed page starts loading with eight stories remaining. Full-article images remain lazy-loaded.

Images show a loading indicator until loaded and a branded placeholder when absent or unavailable. A visible status in the navigation dock shows when more stories are loading, with a retry button after a failed request. At the end of the loaded stories, forward navigation stays unavailable until the next page arrives; loading never advances the reader automatically.

## Features

- One story per viewport with vertical scroll snapping, touch/mouse scrolling, keyboard arrows/Page Up/Page Down, and previous/next buttons.
- Twenty latest articles initially, pagination in batches of 20 up to a 100-story daily brief, duplicate removal, retry, loading and error states.
- Canonical `/<category>/<slug>/` paths with redirects from old `/news/<slug>/` links; sanitized server-rendered full articles, authors, dates, images, related latest stories and source links.
- Native sharing; WhatsApp, Facebook, X, LinkedIn, Telegram and copy-link fallback.
- Full-archive search at `/search/`, relevance sorting, 20 results per page, direct article links and empty/error states. The 100-story daily brief limit does not restrict search or sitemaps.
- Device-local bookmarks and recently read lists (latest 30 each), theme preference, refresh-safe `/brief/<category>/<slug>/` reader URLs. Full stories keep `/<category>/<slug>/`, and the full-article canonical is used by both reading modes. Returning from a full story opens that story in the reader; the homepage starts with the latest story.
- Light/dark themes, reduced motion, keyboard focus, skip link, accessible share dialog and responsive layout.
- Canonical URLs, Open Graph, Twitter cards, NewsArticle JSON-LD, full-archive sitemap index and 48-hour news sitemap.

Summaries use an exposed `meta.news_summary` editorial field, then a sufficiently long existing excerpt, then up to 90 verbatim words from the article. No AI rewriting or invented news. Sticky posts are editor picks; breaking news is not inferred. Longer summaries scroll inside compact cards to keep action buttons visible. Detail-page hero and inline images use lazy loading; inline images decode asynchronously.

The optional `POST /api/revalidate` endpoint accepts `Authorization: Bearer <REVALIDATE_SECRET>` with a secret of at least 32 characters and marks cached WordPress data stale. A CMS publish hook must be configured separately. Default cache refresh is 60 seconds on demand; an already open reader does not poll for new articles.

The official logos are stored locally in `public/pratirodh-logo.png` (light mode) and `public/pratirodh-logo-dark.png` (dark mode), switching with the active theme. The bilingual About Us page is available at `/about-us/`.

## Per-story SEO

Every public story uses the same shared SEO builder for its server-rendered article page and its active position in the swipe reader. Swiping updates the browser title, description, canonical URL, Open Graph/Twitter metadata, author/dates, and one NewsArticle JSON-LD block. Stories without an image clear the previous image tags. Leaving the feed restores the destination page’s metadata. Saved/recent library pages retain their own noindex policy.

Direct category/slug URLs render full article content and SEO on the server; crawlers and sharing previews do not have to swipe or execute JavaScript. Sitemap chunks expose the full published archive when production indexing is enabled. The local preview remains deliberately noindex. Configure the final production origin and enable indexing only at launch.

The detail page’s `NewsArticle` JSON-LD includes the full plain-text article in `articleBody`, preserving all content without truncation and safely escaping script-sensitive characters. The reader keeps its compact story schema.

## Deployment

Read [deployment notes](docs/DEPLOYMENT.md) before publishing. `ALLOW_INDEXING=false` is deliberate for local/staging use. WordPress HTTPS and final hosting compatibility remain launch requirements. No production deployment was performed.

## Strict GitHub rule

Only **`charan-chauhan`** may own the repository and authenticate a push. No repository was initialized or pushed. A browser login does not establish Git authentication.

After the user's local review and push instruction:

1. Choose a repository under `https://github.com/charan-chauhan/` only.
2. Authenticate GitHub CLI as `charan-chauhan`; configure HTTPS Git transport with `gh auth setup-git`, verifying there are no overriding credentials.
3. Initialize Git inside this folder only, excluding the parent backup workspace.
4. Run `chmod +x .githooks/pre-push` and `git config core.hooksPath .githooks`.
5. Set the remote, run `npm run verify:github`, review tracked files and checks, then commit/push.

The guard blocks other repository owners or an unknown CLI identity. It is preparation; no hook is active before repository initialization/configuration. Prefer verified GitHub CLI HTTPS transport because the guard cannot verify independent SSH keys. Never include `.netrc`, environment files, backups or database exports in Git.
