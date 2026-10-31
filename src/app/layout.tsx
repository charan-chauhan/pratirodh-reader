import type { Metadata, Viewport } from 'next';
import { siteUrl, indexable } from '@/lib/site';
import './globals.css';
import './reader.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: { default: 'Pratirodh — A clearer view', template: '%s | Pratirodh' },
  description: 'Independent voices. Essential stories. A fresh perspective on the stories that shape our world.',
  robots: { index: indexable, follow: indexable },
  openGraph: { siteName: 'Pratirodh', type: 'website', locale: 'en_IN', title: 'Pratirodh — A clearer view' },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f6f5f1' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('pratirodh:theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}` }}/></head><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
