import { NextRequest, NextResponse } from 'next/server';
import { getArticle, getArticlesByIds, getFeed, searchArticles } from '@/lib/wordpress';
import { FEED_LIMIT, FEED_PAGE_SIZE, SEARCH_QUERY_LIMIT, normalizeSearch } from '@/lib/news-settings';
export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids');
  const slug = request.nextUrl.searchParams.get('slug');
  try {
    if (slug !== null) {
      if (!slug || slug.length > 600 || /[\/?#]/.test(slug)) return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
      const article = await getArticle(slug);
      return article ? NextResponse.json({ article }) : NextResponse.json({ error: 'Story not found.' }, { status: 404 });
    }
    if (ids !== null) {
      if (!/^\d+(,\d+){0,29}$/.test(ids)) return NextResponse.json({ error: 'Invalid article IDs.' }, { status: 400 });
      return NextResponse.json({ articles: await getArticlesByIds(ids.split(',').map(Number)) });
    }
    const page = request.nextUrl.searchParams.get('page') || '1';
    if (!/^[1-9]\d{0,3}$/.test(page)) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
    const query = request.nextUrl.searchParams.get('q');
    if (query !== null) {
      const search = normalizeSearch(query);
      if (!search || search.length > SEARCH_QUERY_LIMIT) return NextResponse.json({ error: 'Enter a search of 1–200 characters.' }, { status: 400 });
      return NextResponse.json(await searchArticles(search, Number(page)));
    }
    if (Number(page) > Math.ceil(FEED_LIMIT / FEED_PAGE_SIZE)) return NextResponse.json({ error: 'The latest-news list contains up to 100 stories.' }, { status: 400 });
    const data = await getFeed(Number(page));
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'News could not be loaded. Please retry.' }, { status: 502 }); }
}
