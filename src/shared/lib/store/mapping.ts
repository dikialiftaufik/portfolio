import type { Collection, SiteSettings, StoreErrorCode } from './types';

// DB snake_case <-> UI camelCase lives only here. The UI never sees it.
const TO_DB: Record<Collection, Record<string, string>> = {
  projects: { githubLink: 'github_link' },
  certificates: { date: 'date_label' },
  tech_stack: {},
  messages: {},
};

function mapKeys(obj: Record<string, unknown>, dict: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) out[dict[key] ?? key] = obj[key];
  return out;
}

export function fromRow<T>(collection: Collection, row: Record<string, unknown>): T {
  const rev: Record<string, string> = {};
  for (const [ui, db] of Object.entries(TO_DB[collection])) rev[db] = ui;
  return mapKeys(row, rev) as T;
}

export function toRow(collection: Collection, values: Record<string, unknown>) {
  const row = mapKeys(values, TO_DB[collection]);
  delete row.id;
  delete row.created_at;
  delete row.updated_at;
  return row;
}

export const settingsFromRow = (row: Record<string, unknown>): SiteSettings => ({
  cvUrl: String(row.cv_url),
});

export const settingsToRow = (settings: SiteSettings) => ({ cv_url: settings.cvUrl });

export class StoreError extends Error {
  readonly code: StoreErrorCode;
  constructor(code: StoreErrorCode, message: string) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
  }
}

export const isStoreError = (e: unknown): e is StoreError => e instanceof StoreError;

const OFFLINE_MESSAGE = "Couldn't reach the server. Check your connection and try again.";
const NETWORK_RE = /failed to fetch|networkerror|network request failed|load failed/i;

interface RawError {
  status?: number;
  code?: string | number;
  message?: string;
  name?: string;
}

// Maps whatever supabase-js / fetch throws onto the store's error taxonomy.
// Unknown errors pass through untouched so the UI never fakes success.
export function classify(error: unknown): unknown {
  if (!error) return new StoreError('offline', OFFLINE_MESSAGE);
  const e = error as RawError;
  const status = e.status ?? e.code;
  if (status === 401 || status === 403 || e.code === '42501') {
    return new StoreError(
      'denied',
      'Action not allowed. Your session may have expired. Log in again.',
    );
  }
  if (
    error instanceof TypeError ||
    e.name === 'TimeoutError' ||
    e.name === 'AbortError' ||
    NETWORK_RE.test(e.message ?? '')
  ) {
    return new StoreError('offline', OFFLINE_MESSAGE);
  }
  return error;
}
