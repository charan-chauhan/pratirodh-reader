import type { Metadata } from 'next';
import type { Article } from './content';
import { articlePath } from './paths';
import { pageSafeUploads, siteUrl } from './site';

/** Shared by server-rendered articles and the active story in the reader. */
export function articleSeo(article: Article) {
  return {
    title: `${article.title} | Pratirodh`,
    description: article.summary.slice(0, 180),
    url: `${siteUrl}${articlePath(article.slug, article.category)}`,
    section: article.category.replace(/-/g, ' '),
    image: article.image && new URL(pageSafeUploads(article.image), siteUrl).href,
    imageAlt: article.imageAlt,
    card: article.image ? 'summary_large_image' as const : 'summary' as const,
  };
}

export function articleMetadata(article: Article): Metadata {
  const seo = articleSeo(article);
  return {
    title: { absolute: seo.title }, description: seo.description,
    authors: [{ name: article.author }], alternates: { canonical: seo.url },
    openGraph: {
      siteName: 'Pratirodh', title: article.title, description: seo.description,
      type: 'article', url: seo.url, publishedTime: article.date,
      modifiedTime: article.modified, authors: [article.author], section: seo.section,
      images: seo.image ? [{ url: seo.image, alt: seo.imageAlt }] : [],
    },
    twitter: {
      card: seo.card, title: article.title, description: seo.description,
      images: seo.image ? [{ url: seo.image, alt: seo.imageAlt }] : [],
    },
  };
}

export function articleStructuredData(article: Article, articleBody?: string) {
  const seo = articleSeo(article);
  return {
    '@context': 'https://schema.org', '@type': 'NewsArticle', '@id': `${seo.url}#article`,
    url: seo.url, headline: article.title, description: seo.description,
    datePublished: article.date, dateModified: article.modified,
    articleSection: seo.section,
    ...(articleBody ? { articleBody } : {}),
    ...(seo.image ? { image: [seo.image] } : {}),
    author: [{ '@type': 'Person', name: article.author }],
    publisher: { '@type': 'Organization', name: 'Pratirodh', url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/pratirodh-logo.png`, width: 309, height: 51 } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': seo.url },
  };
}

export function structuredDataJson(article: Article, articleBody?: string) {
  return JSON.stringify(articleStructuredData(article, articleBody)).replace(/</g, '\\u003c');
}
