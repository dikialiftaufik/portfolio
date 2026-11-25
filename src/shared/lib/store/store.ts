// Store module: the single seam both views read and write through.
//   list(collection)            -> { data, source: 'live' | 'seed' }
//   subscribe(collection, cb)   -> unsubscribe()
//   create / update / remove    -> admin writes (live backend only)
//   sendMessage(input)          -> visitor contact form
//   client()                    -> supabase client | null (admin auth surface)
// Adapters: Supabase (live) and Seed (offline fallback).
// Error codes: 'not-configured' | 'offline' | 'denied' | 'validation' | 'rate-limited'.

import type { SupabaseClient } from '@supabase/supabase-js';
import { certificatesData, projectsData, techStackData } from '@/content/seed';
import type { BackendConfig } from '../config';
import { StoreError, classify, fromRow, isStoreError, toRow } from './mapping';
import type { Collection, CollectionMap, ListResult, MessageInput, Values } from './types';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const COLLECTIONS: readonly Collection[] = ['projects', 'certificates', 'tech_stack', 'messages'];
const RPC_MISSING = 'PGRST202';

export interface StoreDeps {
  config: () => BackendConfig | null;
  client: () => Promise<SupabaseClient | null>;
}

type Row = Record<string, unknown>;

export function createPortfolioStore({ config, client }: StoreDeps) {
  const inflight = new Map<string, Promise<ListResult<unknown>>>();

  async function requireLive(): Promise<SupabaseClient> {
    const sb = await client();
    if (!sb)
      throw new StoreError('not-configured', "Backend isn't configured. Connect Supabase first.");
    return sb;
  }

  function seedFor(collection: Collection): unknown[] {
    if (collection === 'projects') return projectsData.slice();
    if (collection === 'certificates') return certificatesData.slice();
    if (collection === 'tech_stack') return techStackData.slice();
    return []; // messages have no seed
  }

  async function liveList(collection: Collection): Promise<unknown[]> {
    const sb = await requireLive();
    // messages has no sort_order: newest first. Content tables keep Showcase
    // order (sort_order, then oldest first).
    const query = sb.from(collection).select('*');
    const ordered =
      collection === 'messages'
        ? query.order('created_at', { ascending: false })
        : query.order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    const { data, error } = await ordered;
    if (error) throw classify(error);
    return (data as Row[]).map((r) => fromRow(collection, r));
  }

  return {
    async list<C extends Collection>(collection: C): Promise<ListResult<CollectionMap[C]>> {
      if (!COLLECTIONS.includes(collection)) {
        throw new StoreError('validation', `Unknown collection: ${String(collection)}.`);
      }
      const key = `list:${collection}`;
      const existing = inflight.get(key);
      if (existing) return existing as Promise<ListResult<CollectionMap[C]>>;

      const run = (async (): Promise<ListResult<unknown>> => {
        if (!config()) return { data: seedFor(collection), source: 'seed' };
        try {
          return { data: await liveList(collection), source: 'live' };
        } catch (e) {
          if ((isStoreError(e) && e.code === 'offline') || e instanceof TypeError) {
            return { data: seedFor(collection), source: 'seed' };
          }
          throw e;
        }
      })();

      inflight.set(key, run);
      try {
        return (await run) as ListResult<CollectionMap[C]>;
      } finally {
        inflight.delete(key);
      }
    },

    subscribe(collection: Collection, cb: () => void): () => void {
      if (!config()) return () => {};
      let channel: ReturnType<SupabaseClient['channel']> | null = null;
      let cancelled = false;
      client().then((sb) => {
        if (cancelled || !sb) return;
        channel = sb
          .channel(`public:${collection}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: collection }, () => cb())
          .subscribe();
      });
      return () => {
        cancelled = true;
        if (channel) void channel.unsubscribe();
      };
    },

    async create<C extends Collection>(
      collection: C,
      values: Values<C>,
    ): Promise<CollectionMap[C]> {
      const sb = await requireLive();
      const { data, error } = await sb
        .from(collection)
        .insert(toRow(collection, values as Row))
        .select()
        .single();
      if (error) throw classify(error);
      return fromRow<CollectionMap[C]>(collection, data as Row);
    },

    async update<C extends Collection>(
      collection: C,
      id: string,
      values: Values<C>,
    ): Promise<CollectionMap[C]> {
      const sb = await requireLive();
      const { data, error } = await sb
        .from(collection)
        .update(toRow(collection, values as Row))
        .eq('id', id)
        .select()
        .single();
      if (error) throw classify(error);
      return fromRow<CollectionMap[C]>(collection, data as Row);
    },

    async remove(collection: Collection, id: string): Promise<void> {
      const sb = await requireLive();
      const { error } = await sb.from(collection).delete().eq('id', id);
      if (error) throw classify(error);
    },

    async sendMessage(input: MessageInput): Promise<void> {
      const name = String(input.name ?? '').trim();
      const email = String(input.email ?? '').trim();
      const message = String(input.message ?? '').trim();
      if (name.length < 2) {
        throw new StoreError(
          'validation',
          "Couldn't send. Tell me your name (at least 2 characters).",
        );
      }
      if (email.length > 254 || !EMAIL_RE.test(email)) {
        throw new StoreError(
          'validation',
          "Couldn't send. That email doesn't look right. Check it and try again.",
        );
      }
      if (message.length < 10 || message.length > 2000) {
        throw new StoreError(
          'validation',
          "Couldn't send. Keep your message between 10 and 2000 characters.",
        );
      }

      const sb = await requireLive();
      // Preferred path: RPC with server-side rate limiting. No SELECT policy is
      // needed because nothing is read back (anon may never read messages).
      const rpc = await sb.rpc('submit_message', {
        p_name: name,
        p_email: email,
        p_message: message,
      });
      if (!rpc.error) return;

      if (rpc.error.message?.includes('rate_limited')) {
        throw new StoreError(
          'rate-limited',
          "Couldn't send. Too many messages right now. Try again later or email me directly.",
        );
      }
      if (rpc.error.code === RPC_MISSING) {
        // Migration 0002 not applied yet: plain insert, deliberately without
        // .select() so RLS (no anon SELECT) cannot reject the response.
        const { error } = await sb.from('messages').insert({ name, email, message });
        if (error) throw classify(error);
        return;
      }
      throw classify(rpc.error);
    },

    async client(): Promise<SupabaseClient | null> {
      return client();
    },
  };
}

export type PortfolioStoreType = ReturnType<typeof createPortfolioStore>;
