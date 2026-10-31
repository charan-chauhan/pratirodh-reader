export function articlePath(slug: string, category = 'news') { return `/${encodeURIComponent(category)}/${encodeURIComponent(slug)}/`; }
export function briefPath(slug: string, category = 'news') { return `/brief${articlePath(slug, category)}`; }
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(date));
}
