import { describe, expect, it, vi } from 'vitest';
import { fakeSupabase, type FakeOptions } from '@/test/fakeSupabase';
import { certificatesData, projectsData, techStackData } from '@/content/seed';
import { createPortfolioStore } from './store';
import { isStoreError } from './mapping';

const CONFIG = { url: 'https://x.supabase.co', anonKey: 'k' };

function liveStore(opts: FakeOptions = {}) {
  const fake = fakeSupabase(opts);
  const store = createPortfolioStore({ config: () => CONFIG, client: async () => fake.client });
  return { store, ...fake };
}

const seedStore = () => createPortfolioStore({ config: () => null, client: async () => null });

const expectCode = async (promise: Promise<unknown>, code: string) => {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(isStoreError(err) && err.code).toBe(code);
};

describe('PortfolioStore.list', () => {
  it('serves the frozen seed when the backend is not configured', async () => {
    const store = seedStore();
    expect(await store.list('projects')).toEqual({ data: projectsData, source: 'seed' });
    expect((await store.list('certificates')).data).toHaveLength(certificatesData.length);
    expect((await store.list('tech_stack')).data).toHaveLength(techStackData.length);
    expect((await store.list('messages')).data).toEqual([]);
  });

  it('maps live rows to UI shape and marks them live', async () => {
    const { store, calls } = liveStore({
      table: { data: [{ id: '1', title: 'T', github_link: 'https://g' }], error: null },
    });
    const res = await store.list('projects');
    expect(res.source).toBe('live');
    expect(res.data[0]).toMatchObject({ githubLink: 'https://g' });
    expect(calls).toContain('order("sort_order",{"ascending":true})');
  });

  it('orders messages newest first', async () => {
    const { store, calls } = liveStore({ table: { data: [], error: null } });
    await store.list('messages');
    expect(calls).toContain('order("created_at",{"ascending":false})');
  });

  it('falls back to the seed (not an error) when the network is down', async () => {
    const { store } = liveStore({ throwOnTable: new TypeError('Failed to fetch') });
    const res = await store.list('projects');
    expect(res.source).toBe('seed');
    expect(res.data).toEqual(projectsData);
  });

  it('surfaces server errors instead of hiding them behind the seed', async () => {
    const { store } = liveStore({ table: { data: null, error: { message: 'boom', code: '500' } } });
    await expect(store.list('projects')).rejects.toMatchObject({ message: 'boom' });
  });

  it('dedupes concurrent list() calls for the same collection', async () => {
    const { store, calls } = liveStore({ table: { data: [], error: null } });
    await Promise.all([store.list('projects'), store.list('projects'), store.list('projects')]);
    expect(calls.filter((c) => c === 'from(projects)')).toHaveLength(1);
  });

  it('rejects unknown collections', async () => {
    const store = seedStore();
    // @ts-expect-error deliberately invalid collection
    await expectCode(store.list('users'), 'validation');
  });
});

describe('PortfolioStore writes', () => {
  it('refuses writes when the backend is not configured', async () => {
    const store = seedStore();
    await expectCode(store.create('projects', { title: 'x' }), 'not-configured');
    await expectCode(store.update('projects', '1', { title: 'x' }), 'not-configured');
    await expectCode(store.remove('projects', '1'), 'not-configured');
  });

  it('create/update map keys and never send server-managed columns', async () => {
    const { store, calls } = liveStore({
      table: { data: { id: '9', github_link: null }, error: null },
    });
    const row = await store.create('projects', { title: 'Hello', githubLink: null });
    expect(row).toMatchObject({ id: '9', githubLink: null });
    expect(calls.some((c) => c.startsWith('insert(') && c.includes('github_link'))).toBe(true);
    await store.update('projects', '9', { title: 'New' });
    expect(calls).toContain('eq("id","9")');
  });

  it('classifies RLS rejections as denied', async () => {
    const { store } = liveStore({ table: { data: null, error: { message: 'rls', status: 401 } } });
    await expectCode(store.remove('projects', '1'), 'denied');
    await expectCode(store.create('projects', { title: 'x' }), 'denied');
  });
});

describe('PortfolioStore.sendMessage', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello there, nice portfolio!',
  };

  it('validates before touching the network', async () => {
    const { store, calls } = liveStore();
    await expectCode(store.sendMessage({ ...valid, name: 'A' }), 'validation');
    await expectCode(store.sendMessage({ ...valid, email: 'nope' }), 'validation');
    await expectCode(
      store.sendMessage({ ...valid, email: `${'a'.repeat(250)}@x.io` }),
      'validation',
    );
    await expectCode(store.sendMessage({ ...valid, message: 'short' }), 'validation');
    await expectCode(store.sendMessage({ ...valid, message: 'x'.repeat(2001) }), 'validation');
    expect(calls).toEqual([]);
  });

  it('reports not-configured so the UI can fall back to mailto', async () => {
    await expectCode(seedStore().sendMessage(valid), 'not-configured');
  });

  it('submits through the rate-limited RPC with trimmed values', async () => {
    const { store, calls } = liveStore();
    await store.sendMessage({
      name: '  Ada Lovelace ',
      email: ' ada@example.com ',
      message: valid.message,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('rpc(submit_message');
    expect(calls[0]).toContain('"p_name":"Ada Lovelace"');
    expect(calls[0]).toContain('"p_email":"ada@example.com"');
  });

  it('maps the server rate limit to a friendly error', async () => {
    const { store } = liveStore({ rpc: { error: { message: 'rate_limited', code: 'P0001' } } });
    await expectCode(store.sendMessage(valid), 'rate-limited');
  });

  it('falls back to a plain insert (without .select) when the RPC is not deployed yet', async () => {
    const { store, calls } = liveStore({
      rpc: { error: { code: 'PGRST202', message: 'not found' } },
      table: { data: null, error: null },
    });
    await store.sendMessage(valid);
    expect(calls).toContain('from(messages)');
    expect(calls.some((c) => c.startsWith('insert('))).toBe(true);
    expect(calls.some((c) => c.startsWith('select('))).toBe(false);
  });

  it('propagates other RPC failures as classified errors', async () => {
    const { store } = liveStore({ rpc: { error: { message: 'x', status: 401 } } });
    await expectCode(store.sendMessage(valid), 'denied');
  });
});

describe('PortfolioStore.subscribe', () => {
  it('is a no-op unsubscribe in seed mode', () => {
    expect(() => seedStore().subscribe('projects', vi.fn())()).not.toThrow();
  });

  it('subscribes through the live client and cleans up', async () => {
    const { store } = liveStore();
    const off = store.subscribe('projects', vi.fn());
    await Promise.resolve();
    expect(() => off()).not.toThrow();
  });
});
