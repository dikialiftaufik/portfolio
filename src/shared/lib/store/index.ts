import type { SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config';
import { createPortfolioStore } from './store';

export * from './types';
export { StoreError, isStoreError } from './mapping';
export { createPortfolioStore } from './store';
export type { PortfolioStoreType } from './store';

const REQUEST_TIMEOUT_MS = 15_000;

// Every REST call gets a timeout so a hung network never leaves the UI loading.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal =
    init?.signal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([init.signal, timeout])
      : (init?.signal ?? timeout);
  return fetch(input, { ...init, signal });
}

let clientPromise: Promise<SupabaseClient | null> | null = null;

// supabase-js is a lazy chunk: first paint never waits for it.
function supabaseClient(): Promise<SupabaseClient | null> {
  const cfg = getConfig();
  if (!cfg) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(cfg.url, cfg.anonKey, {
      global: { fetch: fetchWithTimeout },
      // supabase-js retries failed GETs with 1s/2s/4s backoff by default. We would rather
      // fall back to the seed immediately and offer a manual "Try again".
      db: { retry: false },
    }),
  );
  return clientPromise;
}

export const PortfolioStore = createPortfolioStore({ config: getConfig, client: supabaseClient });
