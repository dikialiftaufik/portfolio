import { describe, expect, it } from 'vitest';
import { get, translations } from './locale';

describe('locale.get', () => {
  it('reads a nested key in the requested language', () => {
    expect(get('contact.btn', 'id')).toBe('Kirim Pesan');
    expect(get('contact.btn', 'en')).toBe('Send Message');
  });

  it('returns arrays for list keys', () => {
    expect(get('nav', 'en')).toEqual(['Home', 'About', 'Portfolio', 'Contact']);
  });

  it('returns undefined for keys missing everywhere', () => {
    expect(get('nope.nothing', 'en')).toBeUndefined();
    expect(get('contact.btn.deeper', 'en')).toBeUndefined();
  });

  it('keeps both languages structurally identical', () => {
    const shape = (o: unknown): unknown =>
      Array.isArray(o)
        ? o.length
        : o && typeof o === 'object'
          ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, shape(v)]))
          : typeof o;
    expect(shape(translations.id)).toEqual(shape(translations.en));
  });

  it('no longer advertises the matcher as AI-powered', () => {
    expect(JSON.stringify(translations)).not.toMatch(/AI-powered|bertenaga AI/);
  });
});
