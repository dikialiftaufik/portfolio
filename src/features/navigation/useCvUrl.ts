import { useEffect, useState } from 'react';
import { parseCvUrl } from '@/shared/lib/cvLink';
import { profile } from '@/shared/lib/profile';
import { PortfolioStore } from '@/shared/lib/store';

export type CvLinkStore = Pick<typeof PortfolioStore, 'getSettings'>;

/** The CV button must always work: start with the bundled link, upgrade when the live one arrives. */
export function useCvUrl(store: CvLinkStore = PortfolioStore): string {
  const [url, setUrl] = useState<string>(profile.cvUrl);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      store
        .getSettings()
        .then(({ data }) => {
          const link = parseCvUrl(data.cvUrl);
          if (!cancelled && link.url !== undefined) setUrl(link.url);
        })
        .catch(() => {}); // the bundled link stays: a visitor can't act on this error
    };
    // Wait for idle so the supabase chunk stays off the critical path (like useShowcaseData).
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    const kickoff = ric ? ric(load, { timeout: 1500 }) : window.setTimeout(load, 200);
    return () => {
      cancelled = true;
      if (ric) window.cancelIdleCallback(kickoff as number);
      else clearTimeout(kickoff as number);
    };
  }, [store]);

  return url;
}
