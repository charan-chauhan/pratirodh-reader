import Link from 'next/link';
export function ReadingTabs({ recent = false }: { recent?: boolean }) {
  return <nav aria-label="Reading library" className="reading-tabs"><Link href="/saved/" aria-current={recent ? undefined : 'page'}>Saved Stories</Link><Link href="/recent/" aria-current={recent ? 'page' : undefined}>Recently Read</Link></nav>;
}
