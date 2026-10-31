import Image from 'next/image';
import Link from 'next/link';
export function Footer() {
  return <footer className="site-footer">
    <div className="footer-top"><Link href="/" className="footer-wordmark official-wordmark" aria-label="Pratirodh home">
      <Image className="logo-light" src="/pratirodh-logo.png" width={309} height={51} alt="Pratirodh"/>
      <Image className="logo-dark" src="/pratirodh-logo-dark.png" width={324} height={52} alt="Pratirodh"/>
    </Link><span>Putting People First.</span></div>
    <div className="footer-links"><nav aria-label="Footer navigation"><Link href="/">Latest News</Link><Link href="/about-us/">About Us</Link><Link href="/saved/">Saved Stories</Link><Link href="/search/">Search the Archive</Link></nav><p>Independent news, views and analysis.<br/>A space for voices that deserve to be heard.</p></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Pratirodh. All rights reserved.</span><span>Free. Fearless. Frank.</span></div>
  </footer>;
}
