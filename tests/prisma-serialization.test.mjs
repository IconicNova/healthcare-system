import assert from 'node:assert/strict';
import test from 'node:test';

import { serializePrismaResult } from '../src/lib/prisma-serialization.js';

test('serializePrismaResult converts decimal-like values to numbers without mutating input', () => {
  const payload = {
    total: {
      toNumber: () => 42.75,
      toString: () => '42.75',
    },
    nested: [
      {
        amount: {
          toNumber: () => 12.5,
          toString: () => '12.5',
        },
      },
    ],
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const serialized = serializePrismaResult(payload);

  assert.equal(serialized.total, 42.75);
  assert.equal(serialized.nested[0].amount, 12.5);
  assert.equal(serialized.createdAt.toISOString(), '2025-01-01T00:00:00.000Z');
  assert.notEqual(serialized.createdAt, payload.createdAt);
  assert.equal(typeof payload.total.toNumber, 'function');
});
