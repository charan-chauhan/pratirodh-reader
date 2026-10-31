export const FEED_PAGE_SIZE = 20;
export const FEED_LIMIT = 100;
export const SEARCH_QUERY_LIMIT = 200;
export function normalizeSearch(value: string) { return value.trim().replace(/\s+/g, ' '); }
