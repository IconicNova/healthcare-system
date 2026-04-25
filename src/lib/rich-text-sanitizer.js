import createDOMPurify from 'dompurify';

const PURIFY_OPTIONS = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onmouseenter'],
  KEEP_CONTENT: true,
};

let browserPurifier = null;

function getPurifier() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!browserPurifier) {
    browserPurifier = createDOMPurify(window);
  }

  return browserPurifier;
}

export function sanitizeRichTextHtml(html) {
  if (typeof html !== 'string' || html.length === 0) {
    return '';
  }

  const purifier = getPurifier();
  if (!purifier) {
    return html;
  }

  return purifier.sanitize(html, PURIFY_OPTIONS);
}

export function sanitizeRichTextHtmlWithPurifier(purifier, html) {
  if (!purifier || typeof html !== 'string' || html.length === 0) {
    return '';
  }

  return purifier.sanitize(html, PURIFY_OPTIONS);
}

export { PURIFY_OPTIONS };
