# Deployment and rollout notes

## Current state

This frontend only reads the existing public WordPress API. Another AI owns the backup process; it has not been inspected, stopped or modified here. No database migration, WordPress plugin installation, hosting change, GitHub push or production deployment was performed.

The supplied audit reported Apache/PHP hosting and an expired self-signed certificate. Public HTTP requests currently work. This app does not disable TLS verification. Before launch, fix CMS/media HTTPS, update `WORDPRESS_API_URL` and verify article-body images and links also use HTTPS.

## Architecture

Keep WordPress on current hosting and run Next.js on a Node-compatible service, such as Vercel, unless the purchased GoDaddy plan is confirmed to support a persistent Node runtime. Public requests cannot establish the plan, SSH access, memory limits, Node support or backup facilities.

The application uses server rendering, route handlers, image optimization, ISR and a webhook. A plain static-file upload does not run those features.

GoDaddy Node.js Hosting deploys the `main` branch of `charan-chauhan/pratirodh-reader`. It installs `dependencies` only, runs `npm run build`, then `npm start`. `npm start` is the standard `next start`, which reads `PORT` from the platform and listens on all interfaces, so build tooling must stay in `dependencies`. The custom standalone launcher caused a runtime `InvariantError` on GoDaddy and is no longer used.

## Launch steps

1. Independently verify the matching WordPress files/database backup and an isolated restore. This frontend does not certify that backup.
2. Confirm the runtime and CMS HTTPS. Use staging before changing DNS.
3. Set the API URL, final HTTPS `NEXT_PUBLIC_SITE_URL` and private webhook secret if needed.
4. Validate the new `/<category>/<slug>/` canonical paths and the built-in permanent redirects from `/news/<slug>/` routes. Check trailing-slash normalization against real old links. Inventory non-article pages and prepare exact 301 mappings for any moved paths. Exclude REST, admin, login and media paths from broad redirects.
5. Choose CMS routing/subdomain and duplicate-indexing policy before moving the public frontend. Do not blindly block the WordPress REST API or media.
6. Set `ALLOW_INDEXING=true` only in final production and rebuild. Check robots, canonical host, `/sitemap.xml`, `/sitemaps/<page>.xml`, `/news-sitemap.xml`, metadata and genuine 404s. The archive is split into 100-article chunks; news sitemap includes up to 1,000 articles from the past 48 hours.
7. Run checks and staging browser tests, physical Android/iOS checks, accessibility review and real Core Web Vitals measurements. Browser emulation does not establish low-end device performance.
8. Configure the authenticated publish webhook separately if required. Cached requests refresh on demand at 60 seconds; already open readers do not poll/reorder automatically.

## Rollback

Preserve the existing WordPress site/content. Record routing, DNS TTL, frontend release and environment configuration before rollout. Roll back to the previous frontend release or previous routing. A read-only frontend rollback should not overwrite WordPress content or require a database restore.

## Limits

Bookmarks/history are device-local, capped at 30 each. No account synchronization, automatic editorial rewriting, official social-account publishing, translation or breaking-news flag is assumed. Related stories use the latest other posts. Embeds outside the HTML sanitization allowlist are removed. Recent CMS content is in English; no multilingual CMS integration has been verified. Hosting audit, TLS repair, live rollout and physical-device/performance testing remain separate work.
