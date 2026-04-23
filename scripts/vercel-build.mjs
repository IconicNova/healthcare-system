import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });

  if (options.stdio === 'inherit') {
    return result;
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

function assertSuccess(result, label) {
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${label} failed`);
  }
}

async function listMigrationNames() {
  const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function baselineExistingDatabase() {
  const migrations = await listMigrationNames();
  const baselineMigrations = migrations.slice(0, -1);

  if (baselineMigrations.length === 0) {
    throw new Error('Cannot baseline database because no historical migrations were found.');
  }

  console.log('Baselining existing database migration history...');
  for (const migration of baselineMigrations) {
    const result = run('npx', ['prisma', 'migrate', 'resolve', '--applied', migration], {
      stdio: 'inherit',
    });
    assertSuccess(result, `prisma migrate resolve --applied ${migration}`);
  }
}

console.log('Generating Prisma Client...');
assertSuccess(run('npx', ['prisma', 'generate'], { stdio: 'inherit' }), 'prisma generate');

console.log('Applying Prisma migrations...');
let migrateResult = run('npx', ['prisma', 'migrate', 'deploy']);
const migrateOutput = `${migrateResult.stdout || ''}\n${migrateResult.stderr || ''}`;

if (migrateResult.status !== 0 && migrateOutput.includes('P3005')) {
  await baselineExistingDatabase();
  migrateResult = run('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
}

assertSuccess(migrateResult, 'prisma migrate deploy');

console.log('Building Next.js app...');
assertSuccess(run('npx', ['next', 'build'], { stdio: 'inherit' }), 'next build');
