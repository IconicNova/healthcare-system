import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import authOptions from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const handler = NextAuth(authOptions);

export const GET = handler;

// Rate-limit login attempts: 5 per 15 minutes per IP
export async function POST(request, context) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const { success, retryAfterMs } = await rateLimit(`auth:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!success) {
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    );
  }

  return handler(request, context);
}
