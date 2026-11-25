import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PortfolioStore,
  isStoreError,
  type SettingsResult,
  type SiteSettings,
} from '@/shared/lib/store';
import { btnGhost } from './components';
import { CvLinkForm } from './forms/CvLinkForm';

/** `loading` before the first answer; `null` when the request failed. */
type Loaded = SettingsResult | 'loading' | null;

export function CvLinkSection({ onNotice }: { onNotice: (message: string | null) => void }) {
  const [settings, setSettings] = useState<Loaded>('loading');
  // A new object per click, so clicking Edit again scrolls and refocuses (like content rows).
  const [editing, setEditing] = useState<object | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    () =>
      PortfolioStore.getSettings().then(setSettings, () => {
        setSettings(null);
      }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editing && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
    }
  }, [editing]);

  const save = async (values: SiteSettings) => {
    setBusy(true);
    setError(null);
    onNotice(null);
    try {
      await PortfolioStore.updateSettings(values);
      setEditing(null);
      onNotice('CV link saved.');
      void load();
    } catch (e) {
      if (isStoreError(e) && e.code === 'denied')
        setError("Couldn't save. Your session expired. Log in again.");
      else if (isStoreError(e) && e.code === 'validation') setError(e.message);
      else setError("Couldn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const current = settings === 'loading' ? null : settings;
  const live = current?.source === 'live';

  return (
    <section aria-label="Site settings">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-heading text-xl font-bold text-white">Site settings</h2>
        {settings === 'loading' ? null : (
          <span className="rounded border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
            {live ? 'Live' : 'Cached'}
          </span>
        )}
      </div>
      {settings === 'loading' ? (
        <p className="font-mono text-sm text-neutral-300">Loading…</p>
      ) : null}
      <div role="status">
        {settings !== 'loading' && !live ? (
          <p className="mb-4 text-sm text-red-300">
            Couldn&apos;t load site settings. Check your connection and try again.
          </p>
        ) : null}
      </div>
      {editing && current ? (
        <div ref={formRef} className="admin-form-wrap mb-4">
          <CvLinkForm
            initial={current.data}
            busy={busy}
            serverError={error}
            onCancel={() => {
              if (!busy) setEditing(null);
            }}
            onSubmit={(values) => void save(values)}
          />
        </div>
      ) : null}
      {settings !== 'loading' ? (
        <ul className="admin-rows space-y-2">
          <li className="flex items-center gap-4 rounded border border-white/5 bg-white/5 p-3 hover:border-white/15">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">Download CV link</span>
              <span className="block truncate font-mono text-xs text-neutral-400">
                {current?.data.cvUrl}
              </span>
            </span>
            {current ? (
              <a
                href={current.data.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open link: current CV, in a new tab"
                className={btnGhost}
              >
                Open link
              </a>
            ) : null}
            <button
              type="button"
              disabled={!live}
              onClick={() => {
                setError(null);
                setEditing({});
              }}
              aria-label="Edit CV link"
              className={`${btnGhost} disabled:opacity-50 disabled:hover:border-white/15 disabled:hover:text-inherit`}
            >
              Edit
            </button>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
