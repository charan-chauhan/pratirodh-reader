import { notFound, permanentRedirect } from 'next/navigation';
import { getArticle, getFeed } from '@/lib/wordpress';
import { articlePath } from '@/lib/paths';

export default async function LegacyBrief({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { slug } = await params;
  await getFeed().catch(() => null);
  const article = await getArticle(slug);
  if (!article) notFound();
  permanentRedirect(articlePath(article.slug, article.category));
}
