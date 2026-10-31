import { Feed } from '@/components/feed';
import { Header } from '@/components/header';
import { getFeed } from '@/lib/wordpress';
import type { Metadata } from 'next';
export const metadata: Metadata = { alternates: { canonical: '/' } };
export const revalidate = 60;
export default async function Home() {
  const initial = await getFeed();
  return <><Header/><div id="main"><Feed initial={initial}/></div><footer className="site-footer"><span>© {new Date().getFullYear()} Pratirodh</span><span>Journalism with a point of view. Yours to explore.</span></footer></>;
}
