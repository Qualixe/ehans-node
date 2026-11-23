/**
 * Allowlist HTML sanitizer for product descriptions (glowy's HtmlSanitizer, same rules).
 * Descriptions are written in the admin and shown to every shopper, so a staff account must not
 * be able to plant scripts. Every tag is rebuilt from scratch: only allowed tags and attributes
 * survive, attribute values are re-escaped, and stray "<" / ">" in text are escaped.
 */

/** tag => allowed attributes */
const ALLOWED: Record<string, string[]> = {
  p: [],
  br: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  h2: [],
  h3: [],
  h4: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  a: ['href', 'title'],
  span: [],
  div: [],
  hr: [],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: [],
  td: [],
};
const VOID = new Set(['br', 'hr']);

/** Removed together with everything inside them. */
const DROP_WITH_CONTENT = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'svg',
  'math',
  'template',
  'noscript',
  'title',
  'head',
];

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Text between tags: keep entities, escape anything that could start markup. */
const escapeText = (text: string) =>
  text
    .replace(/&(?![a-z][a-z0-9]*;|#\d+;|#x[0-9a-f]+;)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function rebuildTag(closing: boolean, rawName: string, rawAttrs: string): string {
  const tag = rawName.toLowerCase();
  const allowed = ALLOWED[tag];
  if (!allowed) return ''; // unknown wrapper (font, center…): drop the tag, keep its text
  if (closing) return VOID.has(tag) ? '' : `</${tag}>`;

  const attrs: string[] = [];
  const attrRe = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of rawAttrs.matchAll(attrRe)) {
    const name = m[1]!.toLowerCase();
    if (!allowed.includes(name)) continue;
    const value = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '').trim();
    if (name === 'href') {
      // strip control characters/whitespace browsers ignore ("java\nscript:")
      // eslint-disable-next-line no-control-regex -- matching control characters is the point
      const compact = value.replace(/[\u0000- \u007f-\u009f]/g, '');
      if (!SAFE_HREF.test(compact)) continue;
      attrs.push(`href="${escapeAttr(value)}"`);
      if (/^https?:\/\//i.test(compact)) attrs.push('rel="noopener nofollow"');
      continue;
    }
    attrs.push(`${name}="${escapeAttr(value)}"`);
  }
  return `<${tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
}

export function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html || !html.trim()) return null;
  let s = html.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<\?[\s\S]*?(?:\?>|$)/g, '');
  for (const tag of DROP_WITH_CONTENT) {
    // whole element, or an unclosed opening tag to the end of the input
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?(?:<\\/${tag}\\s*>|$)`, 'gi'), '');
    s = s.replace(new RegExp(`<\\/?${tag}\\b[^>]*>?`, 'gi'), '');
  }

  let out = '';
  let last = 0;
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  for (const m of s.matchAll(tagRe)) {
    out += escapeText(s.slice(last, m.index));
    out += rebuildTag(m[1] === '/', m[2]!, m[3] ?? '');
    last = m.index + m[0].length;
  }
  out += escapeText(s.slice(last));
  out = out.trim();
  return out === '' ? null : out;
}
