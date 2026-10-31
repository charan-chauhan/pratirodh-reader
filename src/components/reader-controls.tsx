'use client';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, Copy, Moon, Share2, Sun, X } from './icons';
import { articlePath } from '@/lib/paths';

const SAVED = 'pratirodh:saved';
export function readSaved(): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SAVED) || '[]');
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id) && id > 0).slice(0, 30) : [];
  } catch { return []; }
}
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('pratirodh:theme', next ? 'dark' : 'light'); } catch { /* Storage can be unavailable. */ }
  }
  return <button className="icon-button" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>;
}
export function BookmarkButton({ id, labeled = false }: { id: number; labeled?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const sync = () => setSaved(readSaved().includes(id)); sync();
    window.addEventListener('pratirodh:saved', sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('pratirodh:saved', sync); window.removeEventListener('storage', sync); };
  }, [id]);
  function toggle() {
    const ids = readSaved();
    try {
      localStorage.setItem(SAVED, JSON.stringify(saved ? ids.filter(value => value !== id) : [id, ...ids].slice(0, 30)));
      setSaved(!saved); window.dispatchEvent(new Event('pratirodh:saved'));
      setMessage(saved ? 'Removed from saved stories' : 'Story saved on this device');
    } catch { setMessage('Saving is unavailable in this browser'); }
  }
  return <><button onClick={toggle} aria-pressed={saved} aria-label={saved ? 'Remove bookmark' : 'Bookmark story'} className={labeled ? 'text-button' : 'icon-button'}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'}/>{labeled && (saved ? 'Saved' : 'Save story')}</button><span className="sr-only" role="status">{message}</span></>;
}
export function ShareButton({ slug, title, category = 'news', labeled = false }: { slug: string; title: string; category?: string; labeled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  const url = () => new URL(articlePath(slug, category), window.location.origin).href;
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url: url() }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    setOpen(true);
  }
  const links = open ? [
    ['WhatsApp', `https://wa.me/?text=${encodeURIComponent(title + ' ' + url())}`],
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`],
    ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`],
    ['Telegram', `https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`],
  ] : [];
  return <>
    <button className={labeled ? 'text-button' : 'icon-button'} aria-label="Share story" onClick={share}><Share2 size={19}/>{labeled && 'Share story'}</button>
    <dialog ref={dialog} className="share-dialog" aria-label="Share this story" onCancel={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }}>
      <div className="dialog-heading"><h2>Good stories travel.</h2><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close sharing"><X size={20}/></button></div>
      <p>Share this story with your world.</p><div className="share-links">{links.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}</div>
      <button className="copy-button" onClick={async () => { try { await navigator.clipboard.writeText(url()); setMessage('Link copied'); } catch { setMessage('Copy unavailable. Select the link below.'); } }}><Copy size={17}/> Copy link</button>
      {open && <input readOnly aria-label="Article link" value={url()} onFocus={e => e.currentTarget.select()}/>}<p role="status">{message}</p>
    </dialog>
  </>;
}
