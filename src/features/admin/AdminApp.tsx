import { useCallback, useEffect, useRef, useState } from 'react';
import { PortfolioStore, isStoreError, type Message } from '@/shared/lib/store';
import {
  DeleteDialog,
  InboxSection,
  Row,
  capitalize,
  deleteNoun,
  type AdminCollection,
  type ContentRow,
  type DeleteTarget,
} from './components';
import { CertForm } from './forms/CertForm';
import { ProjectForm } from './forms/ProjectForm';
import { TechForm } from './forms/TechForm';
import { LoginForm } from './LoginForm';
import { removeOldFile, uploadImage } from './upload';

type AuthState = 'checking' | 'no-backend' | 'signed-out' | 'signed-in';
type Lists = Record<AdminCollection, ContentRow[]>;
interface Editing {
  collection: AdminCollection;
  row: ContentRow | null;
}

const SECTIONS: { id: AdminCollection; title: string; add: string }[] = [
  { id: 'projects', title: 'Projects', add: 'Add project' },
  { id: 'certificates', title: 'Certificates', add: 'Add certificate' },
  { id: 'tech_stack', title: 'Tech stack', add: 'Add tech' },
];
const LOAD_COLS = ['projects', 'certificates', 'tech_stack', 'messages'] as const;

export function AdminApp() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [configured, setConfigured] = useState(false);
  const [lists, setLists] = useState<Lists>({ projects: [], certificates: [], tech_stack: [] });
  const [source, setSource] = useState<'live' | 'seed'>('seed');
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    let cancelled = false;
    void PortfolioStore.client().then((sb) => {
      if (cancelled) return;
      setConfigured(!!sb);
      if (!sb) {
        setAuthState('no-backend');
        return;
      }
      void sb.auth.getSession().then(({ data }) => {
        if (!cancelled) setAuthState(data.session ? 'signed-in' : 'signed-out');
      });
      sub = sb.auth.onAuthStateChange((_event, session) => {
        setAuthState(session ? 'signed-in' : 'signed-out');
      }).data.subscription;
    });
    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  // One failing section must not blank the rest: settle each collection
  // independently and name what failed.
  const load = useCallback(
    () =>
      Promise.allSettled(LOAD_COLS.map((col) => PortfolioStore.list(col))).then(([p, c, t, m]) => {
        const failed: string[] = [];
        const results = { projects: p, certificates: c, tech_stack: t, messages: m } as const;
        (Object.keys(results) as (keyof typeof results)[]).forEach((k) => {
          if (results[k]?.status === 'rejected') failed.push(k);
        });

        setLists((prev) => ({
          projects: p?.status === 'fulfilled' ? (p.value.data as ContentRow[]) : prev.projects,
          certificates:
            c?.status === 'fulfilled' ? (c.value.data as ContentRow[]) : prev.certificates,
          tech_stack: t?.status === 'fulfilled' ? (t.value.data as ContentRow[]) : prev.tech_stack,
        }));
        if (m?.status === 'fulfilled') {
          setMessages(
            (m.value.data as Message[])
              .slice()
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
          );
        }
        const live = [p, c, t].every((r) => r?.status === 'fulfilled' && r.value.source === 'live');
        setSource(live ? 'live' : 'seed');
        setNotice(
          failed.length
            ? `Couldn't load ${failed.join(', ')}. Check your connection and try again.`
            : null,
        );
      }),
    [],
  );

  useEffect(() => {
    if (editing && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current
        .querySelector<HTMLElement>('input, textarea, select')
        ?.focus({ preventScroll: true });
    }
  }, [editing]);

  useEffect(() => {
    if (authState !== 'signed-in') return;
    void load();
    const offs = LOAD_COLS.map((col) => PortfolioStore.subscribe(col, () => void load()));
    return () => offs.forEach((off) => off());
  }, [authState, load]);

  const logout = () => {
    void PortfolioStore.client().then((sb) => sb?.auth.signOut());
  };

  const saveForm = async (
    collection: AdminCollection,
    row: ContentRow | null,
    values: Record<string, unknown>,
    fileInfo: { file: File | null } | null,
  ) => {
    setFormBusy(true);
    setFormError(null);
    const folder = collection === 'projects' ? 'projects' : 'certs';
    try {
      let image = values.image as string | undefined;
      if (fileInfo?.file) image = await uploadImage(fileInfo.file, folder);
      const payload = (collection === 'tech_stack' ? values : { ...values, image }) as never;
      const old = row && 'image' in row ? row.image : null;
      if (row) await PortfolioStore.update(collection, (row as { id: string }).id, payload);
      else await PortfolioStore.create(collection, payload);
      if (old && old !== image) void removeOldFile(old);
      setEditing(null);
      setNotice(`${capitalize(deleteNoun(collection))} saved.`);
      void load();
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      const code = (e as { code?: string }).code;
      if (isStoreError(e) && e.code === 'denied')
        setFormError("Couldn't save. Your session expired. Log in again.");
      else if (code === '23505' || /duplicate|already exists/i.test(message))
        setFormError('That tech name already exists. Use a different name.');
      else if (isStoreError(e) && e.code === 'validation') setFormError(e.message);
      else setFormError("Couldn't save. Check your connection and try again.");
    } finally {
      setFormBusy(false);
    }
  };

  const markRead = (m: Message) => {
    PortfolioStore.update('messages', m.id, { is_read: true })
      .then(() => load())
      .catch(() => setNotice("Couldn't update the message. Check your connection and try again."));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await PortfolioStore.remove(deleteTarget.collection, (deleteTarget.row as { id: string }).id);
      setNotice(`${capitalize(deleteNoun(deleteTarget.collection))} deleted.`);
      setDeleteTarget(null);
      void load();
    } catch (e) {
      if (isStoreError(e) && e.code === 'denied')
        setDeleteError("Couldn't delete. Your session expired. Log in again.");
      else setDeleteError("Couldn't delete. Check your connection and try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const renderForm = (ed: Editing) => {
    const common = {
      busy: formBusy,
      serverError: formError,
      onCancel: () => {
        if (!formBusy) setEditing(null);
      },
      onSubmit: (values: object, fileInfo: { file: File | null } | null) =>
        void saveForm(ed.collection, ed.row, values as Record<string, unknown>, fileInfo),
    };
    const key = (ed.row && (ed.row as { id?: string }).id) || 'new';
    const initial = ed.row ?? {};
    if (ed.collection === 'projects')
      return <ProjectForm key={key} initial={initial} {...common} />;
    if (ed.collection === 'certificates')
      return <CertForm key={key} initial={initial} {...common} />;
    return <TechForm key={key} initial={initial} {...common} />;
  };

  return (
    <div className="admin-console mx-auto min-h-screen max-w-4xl px-6 py-10">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-void"
      >
        Skip to content
      </a>
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            Portfolio console
          </p>
          <h1 className="font-heading text-3xl font-bold text-white">Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="font-mono text-xs text-neutral-300 hover:text-cyan-400">
            View site
          </a>
          {authState === 'signed-in' ? (
            <button
              type="button"
              onClick={logout}
              className="rounded border border-white/20 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-400"
            >
              Log out
            </button>
          ) : null}
        </div>
      </header>

      <div role="status" aria-live="polite">
        {notice ? <p className="mb-6 font-mono text-sm text-cyan-300">{notice}</p> : null}
      </div>

      {authState === 'checking' ? (
        <p className="font-mono text-sm text-neutral-300">Checking session…</p>
      ) : null}
      {authState === 'no-backend' || authState === 'signed-out' ? (
        <LoginForm configured={configured} onDone={() => setAuthState('signed-in')} />
      ) : null}

      {authState === 'signed-in' ? (
        <main id="admin-main" className="space-y-10">
          {SECTIONS.map((sec) => (
            <section key={sec.id} aria-label={sec.title}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-heading text-xl font-bold text-white">{sec.title}</h2>
                <span className="rounded border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  {source === 'live' ? 'Live' : 'Cached'}
                </span>
                <span className="font-mono text-xs text-neutral-400">{lists[sec.id].length}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setEditing({ collection: sec.id, row: null });
                  }}
                  className="ml-auto rounded border border-white/15 px-3 py-1.5 font-mono text-xs hover:border-cyan-400 hover:text-cyan-400"
                >
                  {sec.add}
                </button>
              </div>
              {editing && editing.collection === sec.id ? (
                <div ref={formRef} className="admin-form-wrap mb-4">
                  {renderForm(editing)}
                </div>
              ) : null}
              {lists[sec.id].length === 0 ? (
                <p className="rounded border border-dashed border-white/10 p-6 text-center font-mono text-sm text-neutral-400">
                  Nothing here yet. Add your first {sec.title.toLowerCase()} with the edit form.
                </p>
              ) : (
                <ul className="admin-rows space-y-2">
                  {lists[sec.id].map((row, i) => (
                    <Row
                      key={(row as { id?: string }).id ?? `${sec.id}-${i}`}
                      collection={sec.id}
                      row={row}
                      onEdit={(c, r) => {
                        setFormError(null);
                        setEditing({ collection: c, row: r });
                      }}
                      onDelete={(c, r) => {
                        setDeleteError(null);
                        setDeleteTarget({ collection: c, row: r });
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
          <InboxSection
            items={messages}
            onMarkRead={markRead}
            onDelete={(m) => {
              setDeleteError(null);
              setDeleteTarget({ collection: 'messages', row: m });
            }}
          />
        </main>
      ) : null}

      <DeleteDialog
        target={deleteTarget}
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />

      <footer className="mt-16 border-t border-white/10 pt-6">
        <p className="font-mono text-xs text-neutral-400">
          The anon key is public by design; row-level security is the real access control. Never
          paste a service_role key here.
        </p>
      </footer>
    </div>
  );
}
