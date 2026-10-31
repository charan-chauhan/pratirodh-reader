'use client';
import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

type TouchGesture = { x: number; y: number; index: number; summary: HTMLElement | null; summaryTop: number; mode: 'pending' | 'story' | 'summary' | 'horizontal'; delta: number };

/** One input gesture owns one navigation; momentum cannot start another story. */
export function useReaderNavigation(rootRef: RefObject<HTMLDivElement | null>, count: number, onActive: (index: number) => void) {
  const countRef = useRef(count);
  const onActiveRef = useRef(onActive);
  const moving = useRef(false);
  const destination = useRef(0);
  const animation = useRef(0);
  useLayoutEffect(() => { countRef.current = count; onActiveRef.current = onActive; }, [count, onActive]);

  const navigate = useCallback((index: number) => {
    const root = rootRef.current;
    if (!root || !countRef.current) return;
    const target = Math.max(0, Math.min(countRef.current - 1, index));
    if (moving.current && target === destination.current) return;
    cancelAnimationFrame(animation.current);
    destination.current = target;
    const from = root.scrollTop;
    // Select immediately; fresh input can retarget an unfinished transition.
    onActiveRef.current(target);
    moving.current = true;
    root.dataset.scrolling = 'true';
    // Native snapping fights intermediate animation positions. Restore it at rest.
    root.style.scrollSnapType = 'none';
    const finish = () => {
      root.scrollTo({ top: target * root.clientHeight, behavior: 'instant' });
      root.style.removeProperty('scroll-snap-type');
      animation.current = 0;
      moving.current = false;
      root.dataset.scrolling = 'false';
    };
    if (Math.abs(from - target * root.clientHeight) < 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    const started = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - started) / 180);
      if (progress >= 1) { finish(); return; }
      const eased = 1 - (1 - progress) ** 3;
      root!.scrollTo({ top: from + (target * root!.clientHeight - from) * eased, behavior: 'instant' });
      animation.current = requestAnimationFrame(tick);
    }
    animation.current = requestAnimationFrame(tick);
  }, [rootRef]);

  const step = useCallback((delta: number) => {
    const root = rootRef.current;
    if (!root) return;
    const index = moving.current ? destination.current : Number(root.dataset.activeIndex || 0);
    navigate(index + delta);
  }, [rootRef, navigate]);

  const hasStories = count > 0;
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !hasStories) return;
    let frame = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let painted: HTMLElement[] = [];
    let lastWheel = 0;
    let wheelDelta = 0;
    let wheelConsumed = false;
    let wheelSummary = false;
    let previousWheelDelta = 0;
    let touch: TouchGesture | null = null;

    function settle() {
      if (settleTimer) clearTimeout(settleTimer);
      if (moving.current) return;
      root!.dataset.scrolling = 'false';
      const index = Math.max(0, Math.min(countRef.current - 1, Math.round(root!.scrollTop / root!.clientHeight)));
      if (Number(root!.dataset.activeIndex) !== index) onActiveRef.current(index);
    }
    function paint() {
      frame = 0;
      const position = root!.scrollTop / root!.clientHeight;
      const center = Math.round(position);
      const cards = Array.from(root!.querySelectorAll<HTMLElement>(':scope > [data-index]')).slice(Math.max(0, center - 1), center + 2);
      for (const card of painted) if (!cards.includes(card)) card.style.setProperty('--distance', '1');
      for (const card of cards) {
        const offset = Number(card.dataset.index) - position;
        card.style.setProperty('--distance', String(Math.min(1, Math.abs(offset))));
        card.style.setProperty('--offset', String(Math.max(-1, Math.min(1, offset))));
      }
      painted = cards;
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(paint);
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 120);
    }
    function summaryCanScroll(summary: HTMLElement | null, delta: number) {
      return !!summary && summary.scrollHeight > summary.clientHeight + 2 && (delta > 0
        ? summary.scrollTop + summary.clientHeight < summary.scrollHeight - 2
        : summary.scrollTop > 2);
    }
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const now = Date.now();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root!.clientHeight : 1);
      const reversed = delta * previousWheelDelta < 0;
      const freshImpulse = Math.abs(previousWheelDelta) < 20 && Math.abs(delta) > Math.max(40, Math.abs(previousWheelDelta) * 2);
      if (now - lastWheel > 200 || reversed || freshImpulse) {
        wheelDelta = 0; wheelConsumed = false;
        const summary = event.target instanceof Element ? event.target.closest<HTMLElement>('.story-summary') : null;
        wheelSummary = summaryCanScroll(summary, delta);
      }
      lastWheel = now;
      previousWheelDelta = delta;
      // A gesture that starts in the summary stays there, even at its edge.
      if (wheelSummary) return;
      event.preventDefault();
      if (wheelConsumed) return;
      wheelDelta += delta;
      if (Math.abs(wheelDelta) < 40) return;
      wheelConsumed = true;
      step(Math.sign(wheelDelta));
    }
    function onTouchStart(event: TouchEvent) {
      touch = null;
      if (event.touches.length !== 1) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('button,input,textarea,select,dialog,[contenteditable]')) return;
      const finger = event.touches[0];
      const summary = target?.closest<HTMLElement>('.story-summary') || null;
      touch = { x: finger.clientX, y: finger.clientY, index: moving.current ? destination.current : Number(root!.dataset.activeIndex || 0), summary, summaryTop: summary?.scrollTop || 0, mode: 'pending', delta: 0 };
    }
    function onTouchMove(event: TouchEvent) {
      if (!touch || event.touches.length !== 1) return;
      const finger = event.touches[0];
      const dx = finger.clientX - touch.x;
      const dy = touch.y - finger.clientY;
      if (touch.mode === 'pending') {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        touch.mode = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : summaryCanScroll(touch.summary, dy) ? 'summary' : 'story';
      }
      if (touch.mode === 'horizontal') return;
      if (event.cancelable) event.preventDefault();
      touch.delta = dy;
      if (touch.mode === 'summary') touch.summary!.scrollTop = touch.summaryTop + dy;
      else root!.style.setProperty('--gesture-drag', `${Math.max(-24, Math.min(24, -dy * .15))}px`);
    }
    function onTouchEnd() {
      root!.style.removeProperty('--gesture-drag');
      const gesture = touch; touch = null;
      if (gesture?.mode === 'story' && Math.abs(gesture.delta) >= 35) navigate(gesture.index + Math.sign(gesture.delta));
    }
    function cancelTouch() { touch = null; root!.style.removeProperty('--gesture-drag'); }
    function onKey(event: KeyboardEvent) {
      if (document.querySelector('dialog[open]') || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable]'))) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return;
      const delta = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1;
      const summary = event.target instanceof Element ? event.target.closest<HTMLElement>('.story-summary') : null;
      if (summaryCanScroll(summary, delta)) return;
      event.preventDefault();
      if (event.repeat) return;
      step(delta);
    }
    const resize = new ResizeObserver(() => {
      const index = Math.max(0, Math.min(countRef.current - 1, Number(root.dataset.activeIndex || 0)));
      if (!moving.current && !touch && Math.abs(root.scrollTop - index * root.clientHeight) > 1) root.scrollTo({ top: index * root.clientHeight, behavior: 'instant' });
    });
    root.dataset.scrolling = 'false';
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('scrollend', settle);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('touchend', onTouchEnd);
    root.addEventListener('touchcancel', cancelTouch);
    window.addEventListener('keydown', onKey);
    resize.observe(root);
    frame = requestAnimationFrame(paint);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(settleTimer);
      cancelAnimationFrame(animation.current);
      root.style.removeProperty('scroll-snap-type');
      moving.current = false;
      resize.disconnect();
      root.removeEventListener('scroll', onScroll); root.removeEventListener('scrollend', settle);
      root.removeEventListener('wheel', onWheel); root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove); root.removeEventListener('touchend', onTouchEnd); root.removeEventListener('touchcancel', cancelTouch);
      window.removeEventListener('keydown', onKey);
    };
  }, [rootRef, hasStories, navigate, step]);
  return { navigate, step };
}
