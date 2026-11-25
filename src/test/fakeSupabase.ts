import type { SupabaseClient } from '@supabase/supabase-js';

interface Result {
  data?: unknown;
  error?: { message?: string; code?: string; status?: number } | null;
}

/** Chainable + awaitable stand-in for a PostgREST query builder. */
function builder(result: () => Result, calls: string[]) {
  const q: Record<string, unknown> = {};
  const chain =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push(`${name}(${args.map((a) => JSON.stringify(a)).join(',')})`);
      return q;
    };
  for (const m of ['select', 'order', 'eq', 'insert', 'update', 'delete', 'single', 'maybeSingle'])
    q[m] = chain(m);
  q.then = (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result()).then(resolve, reject);
  return q;
}

export interface FakeOptions {
  /** Result for every table query. */
  table?: Result;
  /** Result for rpc(). */
  rpc?: Result;
  /** Throw this from every table query instead (simulates fetch failure). */
  throwOnTable?: unknown;
}

export function fakeSupabase(opts: FakeOptions = {}) {
  const calls: string[] = [];
  const client = {
    from: (table: string) => {
      calls.push(`from(${table})`);
      return builder(() => {
        if (opts.throwOnTable) throw opts.throwOnTable;
        return opts.table ?? { data: [], error: null };
      }, calls);
    },
    rpc: (fn: string, args: unknown) => {
      calls.push(`rpc(${fn},${JSON.stringify(args)})`);
      return Promise.resolve(opts.rpc ?? { data: null, error: null });
    },
    channel: () => {
      const channel = {
        on: () => channel,
        subscribe: () => channel,
        unsubscribe: () => Promise.resolve('ok'),
      };
      return channel;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}
