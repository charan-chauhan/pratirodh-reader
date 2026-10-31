export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const indexable = process.env.ALLOW_INDEXING === 'true';
export const wordpressApiUrl = process.env.WORDPRESS_API_URL || 'http://www.pratirodh.com/wp-json/wp/v2';
export const cmsOrigin = new URL(wordpressApiUrl).origin;
export const cmsSeparate = new URL(cmsOrigin).host !== new URL(siteUrl).host;
export const fromLegacyUploads = (value: string) => value.replace(/https?:\/\/(?:www\.)?pratirodh\.com\/wp-content\//g, `${cmsOrigin}/wp-content/`);
