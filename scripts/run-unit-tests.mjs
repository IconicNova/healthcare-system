import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function collectTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (!/\.(test|spec)\.(mjs|js|cjs|ts|tsx|jsx)$/i.test(entry.name)) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf8');
    if (content.includes('@playwright/test')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

const projectRoot = resolve(process.cwd());
const testRoot = join(projectRoot, 'tests');
const files = collectTestFiles(testRoot);

if (files.length === 0) {
  process.exit(0);
}

execFileSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
