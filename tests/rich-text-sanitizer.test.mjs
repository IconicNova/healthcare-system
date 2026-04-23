import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { sanitizeHtml } from '../src/lib/rich-text-sanitizer.js';

function run() {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>');
  const dirty = '<p>Hello</p><script>alert(1)</script><img src=x onerror="alert(2)">';
  const clean = sanitizeHtml(dirty, window);

  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('onerror'), false);
  assert.equal(clean.includes('<p>Hello</p>'), true);
}

run();
console.log('rich text sanitizer tests passed');
