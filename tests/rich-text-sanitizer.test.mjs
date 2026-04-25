import assert from 'node:assert/strict';
import test from 'node:test';

import { PURIFY_OPTIONS, sanitizeRichTextHtmlWithPurifier } from '../src/lib/rich-text-sanitizer.js';

test('rich text sanitizer removes scripts and inline event handlers', () => {
  const purifier = {
    sanitize(html, options) {
      assert.deepEqual(options, PURIFY_OPTIONS);
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/\son[a-z]+="[^"]*"/gi, '');
    },
  };

  const cleaned = sanitizeRichTextHtmlWithPurifier(
    purifier,
    '<p><strong>Safe</strong></p><img src="x" onerror="alert(1)"><script>alert(2)</script>'
  );

  assert.match(cleaned, /<p><strong>Safe<\/strong><\/p>/);
  assert.equal(cleaned.includes('<script>'), false);
  assert.equal(cleaned.includes('onerror='), false);
});
