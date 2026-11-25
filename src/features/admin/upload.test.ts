import { describe, expect, it } from 'vitest';
import { MAX_INPUT_BYTES, monthLabel, normalizeFileName, validateImageFile } from './upload';

describe('normalizeFileName', () => {
  it('kebab-cases and strips extension and odd characters', () => {
    expect(normalizeFileName('My Photo (final) #2.PNG')).toBe('my-photo-final-2');
  });
  it('can end up empty', () => {
    expect(normalizeFileName('***.png')).toBe('');
  });
});

describe('validateImageFile', () => {
  const file = (over: Partial<{ type: string; size: number; name: string }> = {}) => ({
    type: 'image/png',
    size: 1000,
    name: 'cover.png',
    ...over,
  });

  it('accepts png/jpg/webp and returns the normalized base name', () => {
    expect(validateImageFile(file())).toBe('cover');
    expect(validateImageFile(file({ type: 'image/webp', name: 'A B.webp' }))).toBe('a-b');
  });

  it('rejects other types, oversize files and unusable names', () => {
    expect(() => validateImageFile(file({ type: 'image/gif' }))).toThrow(/PNG, JPG, or WebP/);
    expect(() => validateImageFile(file({ size: MAX_INPUT_BYTES + 1 }))).toThrow(/too large/);
    expect(() => validateImageFile(file({ name: '***.png' }))).toThrow(/letters or numbers/);
  });
});

describe('monthLabel', () => {
  it('formats a month input value', () => {
    expect(monthLabel('2026-01')).toBe('Jan 2026');
  });
  it('is empty for invalid input', () => {
    expect(monthLabel('')).toBe('');
    expect(monthLabel('nope')).toBe('');
  });
});
