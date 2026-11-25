import { describe, expect, it } from 'vitest';
import { CV_URL_MAX, parseCvUrl } from './cvLink';

const INVALID = { error: 'Paste a full https link, e.g. https://drive.google.com/…' };

describe('parseCvUrl', () => {
  it('accepts a Drive share link, query string included', () => {
    const url = 'https://drive.google.com/file/d/abc/view?usp=sharing';
    expect(parseCvUrl(url)).toEqual({ url });
  });

  it('trims the edges and normalizes the scheme and host', () => {
    expect(parseCvUrl('  HTTPS://Example.COM/cv.pdf \n')).toEqual({
      url: 'https://example.com/cv.pdf',
    });
  });

  it.each([
    ['empty', ''],
    ['inner space', 'https://example.com/my cv.pdf'],
    ['http', 'http://example.com/cv.pdf'],
    ['script', 'javascript:alert(1)'],
    ['data', 'data:text/html,hi'],
    ['relative', '/cv.pdf'],
    ['dotless host', 'https://localhost/cv.pdf'],
    ['trailing-dot-only host', 'https://localhost./cv.pdf'],
    ['user info', 'https://user@evil.example.com/cv'],
    ['password', 'https://a:b@evil.example.com/cv'],
  ])('rejects %s', (_name, raw) => {
    expect(parseCvUrl(raw)).toEqual(INVALID);
  });

  it('enforces the length limit on the normalized link', () => {
    const base = 'https://example.com/';
    const fits = base + 'a'.repeat(CV_URL_MAX - base.length);
    expect(parseCvUrl(fits)).toEqual({ url: fits });
    expect(parseCvUrl(`${fits}a`)).toEqual({ error: 'Keep the link under 2048 characters.' });
  });
});
