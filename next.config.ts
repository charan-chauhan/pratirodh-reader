import type { NextConfig } from 'next';
import { cmsOrigin, cmsSeparate } from './src/lib/site';
const cms = new URL(cmsOrigin);
const config: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'www.pratirodh.com', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'www.pratirodh.com', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'pratirodh.com', pathname: '/wp-content/uploads/**' },
      { protocol: cms.protocol.replace(':', '') as 'http' | 'https', hostname: cms.hostname, pathname: '/wp-content/uploads/**' },
    ],
  },
  async redirects() {
    return cmsSeparate ? [
      { source: '/wp-admin/', destination: `${cmsOrigin}/wp-admin/`, permanent: false },
      { source: '/wp-admin/:path*', destination: `${cmsOrigin}/wp-admin/:path*`, permanent: false },
      { source: '/wp-login.php', destination: `${cmsOrigin}/wp-login.php`, permanent: false },
    ] : [];
  },
  async rewrites() {
    return { beforeFiles: cmsSeparate ? [
      { source: '/wp-content/:path*', destination: `${cmsOrigin}/wp-content/:path*` },
      { source: '/wp-json/:path*', destination: `${cmsOrigin}/wp-json/:path*` },
    ] : [], afterFiles: [], fallback: [] };
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      ...(process.env.ALLOW_INDEXING === 'true' ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
    ] }];
  },
};
export default config;
