'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, Search, Menu, X } from './icons';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './story-actions';
import { sections } from '@/lib/sections';
import { sectionPath } from '@/lib/paths';
export function Header({ saved = false }: { saved?: boolean }) {
  const pathname = usePathname();
  const inSearch = pathname.startsWith('/search');
  const inAbout = pathname.startsWith('/about-us');
  const inSaved = saved || pathname.startsWith('/saved') || pathname.startsWith('/recent');
  const inHome = pathname === '/';
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date());
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
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const element = header.current;
    const sectionNav = element?.querySelector<HTMLElement>('.section-nav');
    if (!element || !sectionNav) return;
    const pin = () => {
      const navShown = getComputedStyle(sectionNav).display !== 'none';
      element.style.top = navShown ? `${sectionNav.offsetHeight - element.offsetHeight}px` : '0px';
    };
    const track = () => setCompact(value => value ? window.scrollY > 40 : window.scrollY > 160);
    pin(); track();
    const observer = new ResizeObserver(pin);
    observer.observe(element);
    window.addEventListener('scroll', track, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', track); };
  }, []);
  const closeMenu = () => setOpen(false);
  return <header className="site-header" ref={header} data-compact={compact} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }}>
    <div className="header-utility">
      <div className="header-actions"><button ref={menuButton} className="icon-button menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={20}/> : <Menu size={20}/>}</button><Link href="/search/" onClick={closeMenu} className={`icon-button header-search${inSearch ? ' active' : ''}`} aria-label="Search Stories"><Search size={19}/></Link><ThemeToggle/></div>
      <nav id="main-navigation" className="header-nav" aria-label="Main navigation" data-open={open} onClick={closeMenu}>
        <Link href="/" className={`nav-link${inHome ? ' active' : ''}`} aria-current={inHome ? 'page' : undefined}>Latest News</Link>
        <Link href="/saved/" className={`nav-link${inSaved ? ' active' : ''}`} aria-current={inSaved ? 'page' : undefined}><Bookmark size={13}/><span>Saved Stories</span></Link>
        <Link href="/about-us/" className={`nav-link${inAbout ? ' active' : ''}`} aria-current={inAbout ? 'page' : undefined}>About Us</Link>
        <div className="menu-sections"><span className="menu-sections-title">Sections</span>{sections.map(section => {
          const href = sectionPath(section.slug);
          return <Link key={section.slug} href={href} className={`nav-link${pathname === href ? ' active' : ''}`} aria-current={pathname === href ? 'page' : undefined}>{section.label}</Link>;
        })}</div>
      </nav>
      <span className="utility-note">Independent. Fearless. Free.</span>
      <span className="utility-date">{today}</span>
    </div>
    <div className="masthead">
      <div className="edition-date"><span>{today}</span><Link href="/#latest">The Latest Edition</Link></div>
      <Link href="/" onClick={closeMenu} className="wordmark official-wordmark" aria-label="Pratirodh home">
        <Image className="logo-light" src="/pratirodh-logo.png" width={309} height={51} alt="Pratirodh" loading="eager"/>
        <Image className="logo-dark" src="/pratirodh-logo-dark.png" width={324} height={52} alt="Pratirodh" loading="eager"/>
      </Link>
      <div className="masthead-note">Putting People First.<small>News, Views &amp; Analysis</small></div>
    </div>
    <nav className="section-nav" aria-label="Sections"><Link href="/" aria-current={inHome ? 'page' : undefined}>Latest</Link>{sections.map(section => {
      const href = sectionPath(section.slug);
      const current = pathname === href;
      return <Link key={section.slug} href={href} aria-current={current ? 'page' : undefined}>{section.label}</Link>;
    })}</nav>
  </header>;
}
