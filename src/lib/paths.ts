import { sections } from './sections';
export function articlePath(slug: string, category = 'news') { return `/${encodeURIComponent(category)}/${encodeURIComponent(slug)}/`; }
export function sectionPath(slug: string, page = 1) { return `/category/${encodeURIComponent(slug)}/${page > 1 ? `?page=${page}` : ''}`; }
export function sectionLabel(category: string) {
  return sections.find(section => section.slug === category)?.label || category.split('-').map((word, index) => index && ['and', 'the', 'for', 'of'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(date));
}
