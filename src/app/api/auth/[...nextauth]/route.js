import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import authOptions, { getNormalizedLoginEmail, getTrustedLoginIp } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const handler = NextAuth(authOptions);

export const GET = handler;

// Rate-limit login attempts: 5 per 15 minutes per IP
export async function POST(request, context) {
  if (process.env.NODE_ENV === 'production') {
    const requestClone = request.clone();
    let attemptEmail = '';

    try {
      const formData = await requestClone.formData();
      attemptEmail = getNormalizedLoginEmail({
        email: formData.get('email'),
      });
    } catch {
      attemptEmail = '';
    }

    const ip = getTrustedLoginIp(request);
    const rateLimitKey = attemptEmail ? `auth:${ip}:${attemptEmail}` : `auth:${ip}`;

    const { success, retryAfterMs } = await rateLimit(rateLimitKey, {
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
  }

  return handler(request, context);
}
