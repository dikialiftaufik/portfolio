import { useCallback, useEffect, useRef, useState } from 'react';
import { PortfolioStore } from '@/shared/lib/store';
import type { Certificate, Project, TechItem } from '@/shared/lib/store';

export type ShowcaseStatus = 'loading' | 'ready' | 'error';

interface ShowcaseState {
  status: ShowcaseStatus;
  source: 'live' | 'seed';
  projects: Project[];
  certificates: Certificate[];
  tech: TechItem[];
}

const COLLECTIONS = ['projects', 'certificates', 'tech_stack'] as const;
const REFRESH_DEBOUNCE_MS = 300;

export interface ShowcaseStore {
  list: typeof PortfolioStore.list;
  subscribe: typeof PortfolioStore.subscribe;
}

/** Data deps live here; the view only renders. `store` is injectable for tests. */
export function useShowcaseData(store: ShowcaseStore = PortfolioStore) {
  const [state, setState] = useState<ShowcaseState>({
    status: 'loading',
    source: 'seed',
    projects: [],
    certificates: [],
    tech: [],
  });
  const requestId = useRef(0);

  const fetchAll = useCallback((): Promise<void> => {
    const id = ++requestId.current;
    // Settle independently: one failing collection must not blank the others.
    return Promise.allSettled([
      store.list('projects'),
      store.list('certificates'),
      store.list('tech_stack'),
    ]).then(([p, c, t]) => {
      if (id !== requestId.current) return; // a newer load superseded this one
      const failed = [p, c, t].some((r) => r.status === 'rejected');
      const allLive = [p, c, t].every((r) => r.status === 'fulfilled' && r.value.source === 'live');
      setState((s) => ({
        status: failed ? 'error' : 'ready',
        source: allLive ? 'live' : 'seed',
        projects: p.status === 'fulfilled' ? p.value.data : s.projects,
        certificates: c.status === 'fulfilled' ? c.value.data : s.certificates,
        tech: t.status === 'fulfilled' ? t.value.data : s.tech,
      }));
    });
  }, [store]);

  // Explicit retry shows the loading state; the first load already starts as 'loading'.
  const reload = useCallback(() => {
    setState((s) => ({ ...s, status: 'loading' }));
    return fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    // The showcase sits below the fold: start loading once the browser is idle so
    // the hero paints first (and the supabase chunk stays off the critical path).
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const kickoff = ric
      ? ric(() => void fetchAll(), { timeout: 1500 })
      : window.setTimeout(() => void fetchAll(), 200);
    // Realtime bursts (several edits in a row) collapse into one reload.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void fetchAll(), REFRESH_DEBOUNCE_MS);
    };
    const offs = COLLECTIONS.map((c) => store.subscribe(c, schedule));
    return () => {
      if (ric) window.cancelIdleCallback(kickoff as number);
      else clearTimeout(kickoff as number);
      clearTimeout(timer);
      requestId.current += 1; // drop any in-flight result after unmount
      offs.forEach((off) => off());
    };
  }, [fetchAll, store]);

  return { ...state, reload };
}
