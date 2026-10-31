'use client';
import Link, { useLinkStatus } from 'next/link';

function PendingIndicator() {
  const { pending } = useLinkStatus();
  return <><span className="pagination-spinner" data-pending={pending} aria-hidden="true"/><span className="sr-only" role="status">{pending ? 'Loading search results…' : ''}</span></>;
}
export function SearchPageLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} prefetch={false} aria-label={label} className="search-page-link"><span>{label}</span><PendingIndicator/></Link>;
}
