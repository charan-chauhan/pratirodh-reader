import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: 'Webhook disabled' }, { status: 503 });
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (Buffer.byteLength(token) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidateTag('wordpress-posts', 'max');
  return Response.json({ revalidated: true });
}
