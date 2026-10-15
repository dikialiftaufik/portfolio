// --- Store Module ---
// Interface (the test surface — keep narrow):
//   PortfolioStore.list(collection) -> Promise<{ data, source: 'live' | 'seed' }>
//   PortfolioStore.subscribe(collection, cb) -> unsubscribe()
//   PortfolioStore.create(collection, values) -> Promise<row>
//   PortfolioStore.update(collection, id, values) -> Promise<row>
//   PortfolioStore.remove(collection, id) -> Promise<void>
//   PortfolioStore.sendMessage({ name, email, message }) -> Promise<row>
//   PortfolioStore.client() -> supabase client | null (admin auth surface)
// Seam: this file. Adapters: Supabase (live) + Seed (offline fallback
// from js/content.js, which stays frozen defaults).
// Error codes: 'not-configured' | 'offline' | 'denied' | 'validation'.
// Write errors (401/403) pass through untouched so UI stays honest.

const SUPABASE_ESM = 'https://esm.sh/@supabase/supabase-js@2.39.0';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const COLLECTIONS = ['projects', 'certificates', 'tech_stack', 'messages'];

// DB snake_case <-> UI camelCase at the Seam. UI never sees snake_case.
const TO_DB = {
    projects: { githubLink: 'github_link' },
    certificates: { date: 'date_label' },
    tech_stack: {},
    messages: {}
};

function mapKeys(obj, dict) {
    const out = {};
    Object.keys(obj).forEach((k) => {
        out[dict[k] || k] = obj[k];
    });
    return out;
}

function fromRow(collection, row) {
    const rev = {};
    Object.keys(TO_DB[collection] || {}).forEach((ui) => {
        rev[TO_DB[collection][ui]] = ui;
    });
    return mapKeys(row, rev);
}

function toRow(collection, values) {
    const row = mapKeys(values, TO_DB[collection] || {});
    delete row.id;
    delete row.created_at;
    delete row.updated_at;
    return row;
}

function storeError(code, message) {
    const e = new Error(message);
    e.code = code;
    return e;
}

function classify(error) {
    if (!error) return storeError('offline', "Couldn't reach the server. Check your connection and try again.");
    const status = error.status || error.code;
    if (status === 401 || status === 403 || error.code === '42501') {
        return storeError('denied', "Action not allowed. Your session may have expired. Log in again.");
    }
    if (error instanceof TypeError || error.message === 'Failed to fetch') {
        return storeError('offline', "Couldn't reach the server. Check your connection and try again.");
    }
    return error;
}

// --- SupabaseAdapter (live) ---
let clientPromise = null;
function supabaseClient() {
    const cfg = getConfig();
    if (!cfg) return Promise.resolve(null);
    if (!clientPromise) {
        clientPromise = import(SUPABASE_ESM).then((m) =>
            m.createClient(cfg.url, cfg.anonKey)
        );
    }
    return clientPromise;
}

const SupabaseAdapter = {
    async list(collection) {
        const sb = await supabaseClient();
        const { data, error } = await sb
            .from(collection)
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw classify(error);
        return data.map((r) => fromRow(collection, r));
    },
    subscribe(collection, cb) {
        let channel = null;
        let cancelled = false;
        supabaseClient().then((sb) => {
            if (cancelled || !sb) return;
            channel = sb
                .channel('public:' + collection)
                .on('postgres_changes', { event: '*', schema: 'public', table: collection }, () => cb())
                .subscribe();
        });
        return () => {
            cancelled = true;
            if (channel) channel.unsubscribe();
        };
    },
    async create(collection, values) {
        const sb = await supabaseClient();
        const { data, error } = await sb.from(collection).insert(toRow(collection, values)).select().single();
        if (error) throw classify(error);
        return fromRow(collection, data);
    },
    async update(collection, id, values) {
        const sb = await supabaseClient();
        const { data, error } = await sb.from(collection).update(toRow(collection, values)).eq('id', id).select().single();
        if (error) throw classify(error);
        return fromRow(collection, data);
    },
    async remove(collection, id) {
        const sb = await supabaseClient();
        const { error } = await sb.from(collection).delete().eq('id', id);
        if (error) throw classify(error);
    },
    async sendMessage({ name, email, message }) {
        const sb = await supabaseClient();
        const { data, error } = await sb.from('messages').insert({ name, email, message }).select().single();
        if (error) throw classify(error);
        return fromRow('messages', data);
    }
};

// --- SeedAdapter (offline fallback; messages stay empty) ---
const SeedAdapter = {
    async list(collection) {
        if (collection === 'projects') return projectsData.slice();
        if (collection === 'certificates') return certificatesData.slice();
        if (collection === 'tech_stack') return techStackData.slice();
        return [];
    },
    subscribe() {
        return () => {};
    }
};

// --- PortfolioStore: picks live when configured, seed otherwise ---
// In-flight dedup (client-swr-dedup, cheap form): concurrent identical
// list() calls share one promise instead of firing N requests.
const inflight = new Map();

const PortfolioStore = {
    async list(collection) {
        if (COLLECTIONS.indexOf(collection) === -1) {
            throw storeError('validation', 'Unknown collection: ' + collection + '.');
        }
        const key = 'list:' + collection;
        if (inflight.has(key)) return inflight.get(key);
        const run = (async () => {
            const cfg = getConfig();
            if (!cfg) return { data: await SeedAdapter.list(collection), source: 'seed' };
            try {
                return { data: await SupabaseAdapter.list(collection), source: 'live' };
            } catch (e) {
                if (e && (e.code === 'offline' || e instanceof TypeError)) {
                    return { data: await SeedAdapter.list(collection), source: 'seed' };
                }
                throw e;
            }
        })();
        inflight.set(key, run);
        try {
            return await run;
        } finally {
            inflight.delete(key);
        }
    },
    subscribe(collection, cb) {
        if (!getConfig()) return SeedAdapter.subscribe(collection, cb);
        return SupabaseAdapter.subscribe(collection, cb);
    },
    async _requireLive() {
        const sb = await supabaseClient();
        if (!sb) throw storeError('not-configured', "Backend isn't configured. Connect Supabase first.");
        return sb;
    },
    async create(collection, values) {
        await this._requireLive();
        return SupabaseAdapter.create(collection, values);
    },
    async update(collection, id, values) {
        await this._requireLive();
        return SupabaseAdapter.update(collection, id, values);
    },
    async remove(collection, id) {
        await this._requireLive();
        return SupabaseAdapter.remove(collection, id);
    },
    async sendMessage({ name, email, message }) {
        const n = String(name || '').trim();
        const m = String(message || '').trim();
        if (n.length < 2) throw storeError('validation', "Couldn't send. Tell me your name (at least 2 characters).");
        if (!EMAIL_RE.test(String(email || '').trim())) {
            throw storeError('validation', "Couldn't send. That email doesn't look right. Check it and try again.");
        }
        if (m.length < 10 || m.length > 2000) {
            throw storeError('validation', "Couldn't send. Keep your message between 10 and 2000 characters.");
        }
        await this._requireLive();
        return SupabaseAdapter.sendMessage({ name: n, email: String(email).trim(), message: m });
    },
    async client() {
        return supabaseClient();
    }
};
