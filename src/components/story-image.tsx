'use client';
import Image from 'next/image';
import { useState } from 'react';
type Props = { src: string | null; alt: string; priority?: boolean; eager?: boolean; hero?: boolean; sizes?: string };

export function StoryImage(props: Props) {
  // A changed source starts a fresh load, including after a previous failure.
  return <StoryImageContent key={props.src || 'placeholder'} {...props}/>;
}
function StoryImageContent({ src, alt, priority = false, eager = false, hero = false, sizes }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const placeholder = failed || !src;
  const pending = !placeholder && !loaded;
  return <span className={`story-media${hero ? ' story-media-hero' : ''}`} data-state={placeholder ? 'placeholder' : pending ? 'loading' : 'ready'} aria-busy={pending}>
    <Image src={placeholder ? '/placeholder.svg' : src} alt={placeholder ? 'Pratirodh story placeholder' : alt}
      {...(hero ? { width: 1200, height: 800 } : { fill: true })}
      sizes={sizes || (hero ? '(max-width: 790px) 90vw, 742px' : '(max-width: 760px) 94vw, 580px')}
      loading={priority || eager ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)}/>
    {pending && <span className="image-loading" role="status"><span className="loading-spinner" aria-hidden="true"/><span>Loading image…</span></span>}
    {placeholder && <span className="image-placeholder-label">Image unavailable</span>}
  </span>;
}
