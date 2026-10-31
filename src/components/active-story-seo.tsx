'use client';

import { useEffect, useRef } from 'react';
import type { Article } from '@/lib/content';
import { articleSeo, structuredDataJson } from '@/lib/article-seo';
import { briefPath } from '@/lib/paths';

type Tag = { selector: string; tag: 'meta' | 'link'; attributes: Record<string, string>; value: string | null; valueAttribute: 'content' | 'href' };
type Snapshot = { original: Element | null; applied: string | null; valueAttribute: string };

function tagsFor(article: Article): Tag[] {
  const seo = articleSeo(article);
  const meta = (key: 'name' | 'property', name: string, value: string | null): Tag => ({
    selector: `meta[${key}="${name}"]`, tag: 'meta', attributes: { [key]: name }, value, valueAttribute: 'content',
  });
  return [
    { selector: 'link[rel="canonical"]', tag: 'link', attributes: { rel: 'canonical' }, value: seo.url, valueAttribute: 'href' },
    meta('name', 'description', seo.description), meta('name', 'author', article.author),
    meta('property', 'og:type', 'article'), meta('property', 'og:site_name', 'Pratirodh'),
    meta('property', 'og:title', article.title), meta('property', 'og:description', seo.description),
    meta('property', 'og:url', seo.url), meta('property', 'og:image', seo.image),
    meta('property', 'og:image:alt', seo.image ? seo.imageAlt : null),
    meta('property', 'article:published_time', article.date), meta('property', 'article:modified_time', article.modified),
    meta('property', 'article:author', article.author), meta('property', 'article:section', seo.section),
    meta('name', 'twitter:card', seo.card), meta('name', 'twitter:title', article.title),
    meta('name', 'twitter:description', seo.description), meta('name', 'twitter:image', seo.image),
    meta('name', 'twitter:image:alt', seo.image ? seo.imageAlt : null),
  ];
}

/** Native history changes preserve the swiper; explicitly keep its head in sync. */
export function ActiveStorySeo({ article }: { article: Article }) {
  const current = useRef(article);
  const sync = useRef<(() => void) | null>(null);

  useEffect(() => {
    const snapshots = new Map<string, Snapshot>();
    const originalTitle = document.title;
    let appliedTitle = '';
    const schema = document.getElementById('active-story-structured-data') as HTMLScriptElement;

    function update() {
      const active = current.current;
      const seo = articleSeo(active);
      if (!document.querySelector('.feed-window')) return;
      const path = location.pathname.replace(/\/$/, '');
      const readerPath = briefPath(active.slug, active.category).replace(/\/$/, '');
      if (path && path !== readerPath) return;
      appliedTitle = seo.title;
      if (document.title !== appliedTitle) document.title = appliedTitle;
      for (const tag of tagsFor(active)) {
        const existing = [...document.head.querySelectorAll(tag.selector)];
        if (!snapshots.has(tag.selector)) snapshots.set(tag.selector, {
          original: existing[0]?.cloneNode(true) as Element || null,
          applied: tag.value, valueAttribute: tag.valueAttribute,
        });
        snapshots.get(tag.selector)!.applied = tag.value;
        if (tag.value === null) { existing.forEach(node => node.remove()); continue; }
        const node = existing[0] || document.createElement(tag.tag);
        for (const [name, value] of Object.entries(tag.attributes)) if (node.getAttribute(name) !== value) node.setAttribute(name, value);
        if (node.getAttribute(tag.valueAttribute) !== tag.value) node.setAttribute(tag.valueAttribute, tag.value);
        if (!node.isConnected) document.head.append(node);
        existing.slice(1).forEach(duplicate => duplicate.remove());
      }
      const json = structuredDataJson(active);
      if (schema.textContent !== json) schema.textContent = json;
    }
    sync.current = update;
    update();
    return () => {
      sync.current = null;
      if (document.title === appliedTitle) document.title = originalTitle;
      for (const [selector, snapshot] of snapshots) {
        const node = document.head.querySelector(selector);
        // Preserve metadata already supplied by the destination route.
        if (node && node.getAttribute(snapshot.valueAttribute) !== snapshot.applied) continue;
        if (snapshot.original) {
          if (node) {
            const originalValue = snapshot.original.getAttribute(snapshot.valueAttribute);
            if (originalValue === null) node.removeAttribute(snapshot.valueAttribute);
            else node.setAttribute(snapshot.valueAttribute, originalValue);
          }
          // A destination route that removed a tag should keep it removed.
        } else node?.remove();
      }
    };
  }, []);

  useEffect(() => { current.current = article; sync.current?.(); }, [article]);
  return <script id="active-story-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataJson(article) }}/>;
}
