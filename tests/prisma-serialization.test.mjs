import assert from 'node:assert/strict';
import { Decimal } from '@prisma/client/runtime/library';
import { serializeApiValue } from '../src/lib/serialization.js';

function run() {
  const value = {
    amount: new Decimal('12.34'),
    nested: [new Decimal('1.10'), { rate: new Decimal('45.67') }],
  };

  assert.deepEqual(serializeApiValue(value), {
    amount: 12.34,
    nested: [1.1, { rate: 45.67 }],
  });
}

run();
console.log('prisma serialization tests passed');
