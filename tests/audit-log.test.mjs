import assert from 'node:assert/strict';
import { logAudit } from '../src/lib/audit-log.js';

async function run() {
  const calls = [];
  const db = {
    auditLog: {
      create: async ({ data }) => {
        calls.push(data);
        return data;
      },
    },
  };

  const session = {
    user: {
      id: 'user-1',
      organizationId: 'org-1',
    },
  };

  await logAudit(db, {
    session,
    action: 'UPDATE',
    entity: 'Client',
    entityId: 'client-1',
    changes: { firstName: 'Ava' },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    action: 'UPDATE',
    entity: 'Client',
    entityId: 'client-1',
    organizationId: 'org-1',
    userId: 'user-1',
    changes: { firstName: 'Ava' },
  });
}

await run();
console.log('audit log tests passed');
