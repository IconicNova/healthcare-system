import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function run() {
  const filesToCheck = [
    'src/app/api/staff/[id]/route.js',
    'src/app/api/care-plans/[id]/generate-visits/route.js',
  ];

  for (const file of filesToCheck) {
    const source = read(file);
    assert.equal(
      source.includes('findUnique({\n      where: {\n        id,\n        organizationId: session.user.organizationId,'),
      false,
      `${file} still uses invalid findUnique lookup with id + organizationId`
    );
  }

  const migrationNames = fs.readdirSync(path.join(root, 'prisma', 'migrations'));
  assert.equal(
    migrationNames.some((name) => name.includes('tenant_email_scope_fix')),
    true,
    'tenant email scope migration is missing'
  );
}

run();
console.log('prisma scope regression tests passed');
