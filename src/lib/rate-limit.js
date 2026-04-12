/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, use Redis-backed rate limiting (e.g., @upstash/ratelimit).
 * This implementation is suitable for single-instance or serverless deployments.
 */

const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.firstRequest > value.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit a request by key.
 * @param {string} key - Unique identifier (e.g., IP address or email)
 * @param {object} options - Configuration
 * @param {number} options.maxRequests - Max requests per window (default: 5)
 * @param {number} options.windowMs - Time window in ms (default: 15 minutes)
 * @returns {{ success: boolean, remaining: number, retryAfterMs: number }}
 */
export function rateLimit(key, { maxRequests = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    // New window
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - entry.firstRequest);
    return { success: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}
