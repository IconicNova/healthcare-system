import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

async function collectUnitTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectUnitTests(resolved));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.test.mjs')) {
      continue;
    }

    const source = await readFile(resolved, 'utf8');
    if (source.includes("@playwright/test")) {
      continue;
    }

    files.push(resolved);
  }

  return files;
}

const testsDir = path.resolve(process.cwd(), 'tests');
const files = await collectUnitTests(testsDir);

if (files.length === 0) {
  console.error('No node:test-compatible test files were found.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
