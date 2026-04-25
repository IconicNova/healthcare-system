const localRateLimitStore = globalThis.__homecareRateLimitStore ?? new Map();
globalThis.__homecareRateLimitStore = localRateLimitStore;

if (!globalThis.__homecareRateLimitCleanupStarted) {
  globalThis.__homecareRateLimitCleanupStarted = true;
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of localRateLimitStore.entries()) {
      if (now - value.firstRequest > value.windowMs) {
        localRateLimitStore.delete(key);
      }
    }
  };

  setInterval(cleanup, 5 * 60 * 1000).unref?.();
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function normalizeUpstashUrl() {
  return process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '') || '';
}

async function upstashCommand(command) {
  const response = await fetch(normalizeUpstashUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || json?.error) {
    throw new Error(json?.error || `Upstash request failed with status ${response.status}`);
  }

  return json?.result;
}

function rateLimitLocal(key, { maxRequests, windowMs }) {
  const now = Date.now();
  const entry = localRateLimitStore.get(key);

  if (!entry || now - entry.firstRequest > windowMs) {
    localRateLimitStore.set(key, { count: 1, firstRequest: now, windowMs });
    return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.firstRequest),
    };
  }

  entry.count += 1;
  return { success: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Rate limit a request by key.
 * Uses Upstash Redis when configured, otherwise falls back to local memory.
 */
export async function rateLimit(key, { maxRequests = 5, windowMs = 15 * 60 * 1000 } = {}) {
  if (!hasUpstashConfig()) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        remaining: 0,
        retryAfterMs: windowMs,
      };
    }

    return rateLimitLocal(key, { maxRequests, windowMs });
  }

  try {
    const redisKey = `rate-limit:${key}`;
    const setResult = await upstashCommand(['SET', redisKey, '1', 'NX', 'PX', windowMs]);

    const count = setResult === 'OK'
      ? 1
      : Number(await upstashCommand(['INCR', redisKey])) || 1;

    const ttl = Number(await upstashCommand(['PTTL', redisKey]));

    if (count > maxRequests) {
      return {
        success: false,
        remaining: 0,
        retryAfterMs: Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs,
      };
    }

    return {
      success: true,
      remaining: Math.max(maxRequests - count, 0),
      retryAfterMs: Number.isFinite(ttl) && ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    console.error('Upstash rate limit check failed, falling back to local store:', error);
    return rateLimitLocal(key, { maxRequests, windowMs });
  }
}
