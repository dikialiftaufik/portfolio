import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

describe('readConfig', () => {
  it('returns url + anon key when both are present', () => {
    expect(
      readConfig({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_ANON_KEY: 'key' }),
    ).toEqual({
      url: 'https://x.supabase.co',
      anonKey: 'key',
    });
  });

  it('is null (seed mode) when either value is missing or blank', () => {
    expect(readConfig({})).toBeNull();
    expect(readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(
      readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: '  ' }),
    ).toBeNull();
  });

  it('treats the REPLACE-ME placeholder as unconfigured', () => {
    expect(
      readConfig({
        VITE_SUPABASE_URL: 'https://REPLACE-ME.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'k',
      }),
    ).toBeNull();
    expect(
      readConfig({
        VITE_SUPABASE_URL: 'https://x.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'REPLACE-ME',
      }),
    ).toBeNull();
  });
});

describe('getConfig', () => {
  it('reads the Vite environment (seed mode when none is set)', async () => {
    const { getConfig } = await import('./config');
    expect(getConfig()).toBeNull();
  });
});
