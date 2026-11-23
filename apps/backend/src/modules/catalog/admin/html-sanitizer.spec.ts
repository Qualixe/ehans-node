import { sanitizeHtml } from './html-sanitizer.js';

describe('sanitizeHtml (glowy HtmlSanitizer rules)', () => {
  it('keeps allowed formatting', () => {
    expect(
      sanitizeHtml('<p>Soft <strong>cotton</strong><br>size <em>M</em></p><ul><li>a</li></ul>'),
    ).toBe('<p>Soft <strong>cotton</strong><br>size <em>M</em></p><ul><li>a</li></ul>');
  });

  it('drops scripts, styles and embeds with their content', () => {
    expect(
      sanitizeHtml('<p>ok</p><script>alert(1)</script><style>p{}</style><iframe src="x"></iframe>'),
    ).toBe('<p>ok</p>');
    expect(sanitizeHtml('<p>ok</p><script>alert(1)')).toBe('<p>ok</p>');
    expect(sanitizeHtml('<svg onload=alert(1)><circle/></svg>hi')).toBe('hi');
  });

  it('removes event handlers, styles and unknown attributes', () => {
    expect(sanitizeHtml('<p onclick="x()" style="color:red" class="a">t</p>')).toBe('<p>t</p>');
    expect(sanitizeHtml('<span dir="ltr">ভালো</span>')).toBe('<span>ভালো</span>');
  });

  it('unwraps unknown tags but keeps their text', () => {
    expect(sanitizeHtml('<font color="red">red</font> <img src=x onerror=alert(1)>')).toBe('red');
  });

  it('only allows safe link targets', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(sanitizeHtml('<a href="java&#x0A;script:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(sanitizeHtml('<a href="//evil.example">x</a>')).toBe('<a>x</a>');
    expect(sanitizeHtml('<a href="https://example.com/a?b=1&amp;c=2" title=\'t"q\'>x</a>')).toBe(
      '<a href="https://example.com/a?b=1&amp;c=2" rel="noopener nofollow" title="t&quot;q">x</a>',
    );
    expect(sanitizeHtml('<a href="/collections/baby">x</a>')).toBe(
      '<a href="/collections/baby">x</a>',
    );
  });

  it('escapes stray markup and comments', () => {
    expect(sanitizeHtml('5 < 6 and 7 > 3 <!-- <script>x</script> -->')).toBe(
      '5 &lt; 6 and 7 &gt; 3',
    );
    // hostile edge case: content may be lost, but no live markup may survive
    const tricky = sanitizeHtml('<p a="<script>">x</p><p>"><script>alert(1)</script></p>') ?? '';
    expect(tricky).not.toMatch(/<(?!\/?p>)/);
  });

  it('returns null for empty input', () => {
    expect(sanitizeHtml('')).toBeNull();
    expect(sanitizeHtml('   ')).toBeNull();
    expect(sanitizeHtml('<script>x</script>')).toBeNull();
  });
});
