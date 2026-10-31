'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, ArrowUpRight, Search, Menu, X } from './icons';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './reader-controls';
export function Header({ saved = false }: { saved?: boolean }) {
  const pathname = usePathname();
  const inSearch = pathname.startsWith('/search');
  const inAbout = pathname.startsWith('/about-us');
  const inSaved = saved || pathname.startsWith('/saved') || pathname.startsWith('/recent');
  const inBrief = !inSaved && !inSearch && !inAbout;
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    header.current?.querySelector<HTMLAnchorElement>('.header-nav a')?.focus();
    function dismiss(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const closeMenu = () => setOpen(false);
  return <header className="site-header" ref={header} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }}>
    <Link href="/" onClick={closeMenu} className="wordmark official-wordmark" aria-label="Pratirodh home">
      <Image className="logo-light" src="/pratirodh-logo.png" width={309} height={51} alt="Pratirodh — Putting People First" loading="eager"/>
      <Image className="logo-dark" src="/pratirodh-logo-dark.png" width={324} height={52} alt="Pratirodh — Putting People First" loading="eager"/>
    </Link>
    <nav id="main-navigation" className="header-nav" aria-label="Main navigation" data-open={open} onClick={closeMenu}>
      <Link href="/" className={`nav-link${inBrief ? ' active' : ''}`} aria-current={inBrief ? 'page' : undefined}>The Daily Brief<span className="live-dot"/></Link>
      <Link href="/saved/" className={`nav-link${inSaved ? ' active' : ''}`} aria-current={inSaved ? 'page' : undefined}><Bookmark size={16}/><span>Saved Stories</span></Link>
      <Link href="/about-us/" className={`nav-link${inAbout ? ' active' : ''}`} aria-current={inAbout ? 'page' : undefined}>About Us<ArrowUpRight size={15}/></Link>
    </nav>
    <div className="header-actions"><Link href="/search/" onClick={closeMenu} className={`icon-button header-search${inSearch ? ' active' : ''}`} aria-label="Search Stories" aria-current={inSearch ? 'page' : undefined}><Search size={19}/></Link><ThemeToggle/><button ref={menuButton} className="icon-button menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={21}/> : <Menu size={21}/>}</button></div>
  </header>;
}
