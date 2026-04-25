import assert from 'node:assert/strict';
import test from 'node:test';

import { rateLimit } from '../src/lib/rate-limit.js';

test('rateLimit falls back to local memory when Upstash is missing in production', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `login:${Date.now()}:${Math.random().toString(16).slice(2)}`;

  process.env.NODE_ENV = 'production';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    const firstAttempt = await rateLimit(key, { maxRequests: 1, windowMs: 1000 });
    assert.equal(firstAttempt.success, true);

    const secondAttempt = await rateLimit(key, { maxRequests: 1, windowMs: 1000 });
    assert.equal(secondAttempt.success, false);
    assert.equal(secondAttempt.remaining, 0);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalUpstashUrl === undefined) {
      delete process.env.UPSTASH_REDIS_REST_URL;
    } else {
      process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
    }

    if (originalUpstashToken === undefined) {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
    }
  }
});
