import sanitizeHtml from 'sanitize-html';

export const RICH_TEXT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4',
  'a',
];

export const RICH_TEXT_ALLOWED_ATTRIBUTES = {
  a: ['href', 'target', 'rel'],
};

export function sanitizeRichTextHtml(value) {
  return sanitizeHtml(`${value || ''}`, {
    allowedTags: RICH_TEXT_ALLOWED_TAGS,
    allowedAttributes: RICH_TEXT_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      b: 'strong',
      i: 'em',
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }, true),
    },
  }).trim();
}

export function stripRichText(value) {
  return sanitizeHtml(`${value || ''}`, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\u00a0/g, ' ').trim();
}

export function extractRichTextLead(value) {
  const html = sanitizeRichTextHtml(value);

  if (!html) {
    return '';
  }

  const firstBlockMatch = html.match(/<(p|h2|h3|h4|blockquote|li)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (firstBlockMatch?.[2]) {
    return stripRichText(firstBlockMatch[2]);
  }

  return stripRichText(html);
}

export function extractRichTextListItems(value) {
  const html = sanitizeRichTextHtml(value);

  if (html) {
    const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((match) => stripRichText(match[1]))
      .filter(Boolean);

    if (items.length > 0) {
      return items;
    }
  }

  return `${value || ''}`
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^\-\s*/, ''));
}