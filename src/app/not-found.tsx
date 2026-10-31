import Link from 'next/link';
export default function NotFound() {
  return <main id="main" className="empty-state"><span className="article-eyebrow">404 · STORY NOT FOUND</span><h1>There’s more to the story.</h1><p>This page may have moved. Explore the latest stories in your daily brief.</p><Link href="/" className="primary-button">Back to the brief</Link></main>;
}
