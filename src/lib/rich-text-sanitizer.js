import createDOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'span',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

function sanitizeWithFallback(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?!p\b|br\b|strong\b|em\b|u\b|s\b|ul\b|ol\b|li\b|blockquote\b|code\b|pre\b|a\b|h1\b|h2\b|h3\b|h4\b|h5\b|h6\b|span\b)[a-z0-9-]+[^>]*>/gi, '')
    .replace(/\s(on[a-z]+)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\s(href)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, ' $1="#"')
    .replace(/\s{2,}/g, ' ');
}

export function sanitizeHtml(html, windowObject = globalThis.window) {
  if (!html) return '';

  if (!windowObject) {
    return sanitizeWithFallback(String(html));
  }

  const DOMPurify = createDOMPurify(windowObject);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['style'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
  });
}
