'use client';
import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from './icons';

export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.9, behavior: reduced ? 'auto' : 'smooth' });
  }
  return <div className="carousel" role="region" aria-roledescription="carousel" aria-label={`${label} stories`}>
    <div className="carousel-track" ref={track}>{children}</div>
    <div className="carousel-controls">
      <button type="button" className="icon-button" aria-label={`Previous ${label} stories`} onClick={() => move(-1)}><ChevronLeft size={18}/></button>
      <button type="button" className="icon-button" aria-label={`Next ${label} stories`} onClick={() => move(1)}><ChevronRight size={18}/></button>
    </div>
  </div>;
}
