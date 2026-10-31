import type { Metadata, Viewport } from 'next';
import { siteUrl, indexable } from '@/lib/site';
import localFont from 'next/font/local';
import './globals.css';
const serif = localFont({ src: './fonts/source-serif-4-latin-wght-normal.woff2', weight: '200 900', variable: '--font-serif', display: 'swap', fallback: ['Georgia', 'Times New Roman', 'serif'] });
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: { default: 'Pratirodh — Putting People First', template: '%s | Pratirodh' },
  description: 'Independent voices. Essential stories. A fresh perspective on the stories that shape our world.',
  robots: { index: indexable, follow: indexable },
  openGraph: { siteName: 'Pratirodh', type: 'website', locale: 'en_IN', title: 'Pratirodh — Putting People First' },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={serif.variable} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('pratirodh:theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){}` }}/></head><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
