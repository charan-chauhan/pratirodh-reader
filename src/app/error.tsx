'use client';
import { RefreshCw } from '@/components/icons';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="empty-state"><div className="loading-brand">pratirodh<span>.</span></div><h1>A brief pause in your brief.</h1><p>We couldn’t reach the newsroom. Your stories will be back as soon as the connection returns.</p><button className="primary-button" onClick={reset}><RefreshCw size={17}/> Try again</button></main>;
}
