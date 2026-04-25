import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function enforceRouteRateLimit(session, routeName, {
  maxRequests = 5,
  windowMs = 15 * 60 * 1000,
  message = 'Too many requests. Please try again later.',
} = {}) {
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = `${routeName}:${session.user.organizationId}:${session.user.id}`;
  const { success, retryAfterMs } = await rateLimit(key, { maxRequests, windowMs });

  if (!success) {
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  return null;
}
