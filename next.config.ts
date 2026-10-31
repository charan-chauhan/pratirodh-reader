import type { NextConfig } from 'next';
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
    ],
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
