import { describe, expect, it } from 'vitest';
import { StoreError, classify, fromRow, isStoreError, toRow } from './mapping';

describe('row mapping', () => {
  it('maps UI camelCase to DB snake_case per collection', () => {
    expect(toRow('projects', { title: 'A', githubLink: 'https://g' })).toEqual({
      title: 'A',
      github_link: 'https://g',
    });
    expect(toRow('certificates', { date: 'Jan 2026' })).toEqual({ date_label: 'Jan 2026' });
  });

  it('strips server-managed columns on write', () => {
    const row = toRow('tech_stack', { id: 'x', created_at: 't', updated_at: 't', name: 'React' });
    expect(row).toEqual({ name: 'React' });
  });

  it('round-trips DB rows back to UI shape', () => {
    expect(fromRow('projects', { id: '1', github_link: 'https://g' })).toEqual({
      id: '1',
      githubLink: 'https://g',
    });
    expect(fromRow('certificates', { date_label: 'Jan 2026' })).toEqual({ date: 'Jan 2026' });
    expect(fromRow('messages', { is_read: false })).toEqual({ is_read: false });
  });
});

describe('classify', () => {
  it('maps auth failures to denied', () => {
    for (const e of [{ status: 401 }, { status: 403 }, { code: '42501' }]) {
      const out = classify(e);
      expect(isStoreError(out) && out.code).toBe('denied');
    }
  });

  it('maps network failures and timeouts to offline', () => {
    const cases = [
      new TypeError('boom'),
      { message: 'TypeError: Failed to fetch' },
      { name: 'TimeoutError' },
      { name: 'AbortError' },
      undefined,
    ];
    for (const e of cases) {
      const out = classify(e);
      expect(isStoreError(out) && out.code).toBe('offline');
    }
  });

  it('passes unknown errors through untouched (never fakes success or a code)', () => {
    const raw = { message: 'duplicate key', code: '23505' };
    expect(classify(raw)).toBe(raw);
  });
});

describe('StoreError', () => {
  it('carries a code and is detectable', () => {
    const e = new StoreError('validation', 'nope');
    expect(e).toBeInstanceOf(Error);
    expect(isStoreError(e)).toBe(true);
    expect(isStoreError(new Error('x'))).toBe(false);
  });
});
