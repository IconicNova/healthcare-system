import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/api/clients/[id]/route.js'),
  'utf8'
);

assert.equal(
  source.includes('await tx.visit.deleteMany'),
  false,
  'client DELETE must preserve visit history'
);
assert.equal(
  source.includes('await tx.invoice.deleteMany'),
  false,
  'client DELETE must preserve invoice history'
);
assert.equal(
  source.includes('await tx.insuranceClaim.deleteMany'),
  false,
  'client DELETE must preserve insurance claim history'
);
assert.equal(
  source.includes('await tx.user.delete'),
  false,
  'client DELETE must disable linked user access instead of deleting the user'
);
assert.equal(
  source.includes("status: 'DISCHARGED'"),
  true,
  'client DELETE must soft-discharge the client'
);
assert.equal(
  source.includes('status: false'),
  true,
  'client DELETE must disable linked user access'
);

console.log('client soft discharge tests passed');
