import { useEffect, useState } from 'react';

import { useUserData } from '@/providers/app-provider';
import { apiErrorKind } from '@/services/api-error-kind';
import type { ScanResult } from '@/types/scan';

export type ScanResultState =
  | { status: 'loading' }
  | { status: 'ready'; result: ScanResult }
  /** `SCAN_NOT_FOUND`, or there is no scan at all to show. */
  | { status: 'not-found' }
  | { status: 'error'; kind: 'network' | 'session' | 'unknown' };

type Fetched = { id: string; attempt: number; state: Exclude<ScanResultState, { status: 'loading' }> };

/**
 * The scan a screen should show. With an `id` (opened from history, Home or a deep link) that is
 * the scan from memory, or else the one from `GET /scans/:id`. Without one it is the newest scan
 * of the history. A scan is never swapped for another one: an unknown id is "not found".
 */
export function useScanResult(routeId?: string | string[]): ScanResultState & { retry: () => void } {
  const { history } = useUserData();
  const [attempt, setAttempt] = useState(0);
  const [fetched, setFetched] = useState<Fetched | null>(null);

  // A route parameter is untrusted text (deep link): anything but one non-empty string is "no id".
  const id = typeof routeId === 'string' && routeId !== '' ? routeId : undefined;
  const remembered = id ? history.find(id) : history.scans[0];
  const needsFetch = id !== undefined && !remembered;
  const fetchScan = history.fetch;

  useEffect(() => {
    if (!needsFetch || !id) return;
    let active = true;
    fetchScan(id)
      .then((result) => {
        if (active) setFetched({ id, attempt, state: { status: 'ready', result } });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const kind = apiErrorKind(error);
        setFetched({
          id,
          attempt,
          state:
            kind === 'not-found'
              ? { status: 'not-found' }
              : { status: 'error', kind: kind === 'network' || kind === 'session' ? kind : 'unknown' },
        });
      });
    return () => {
      active = false;
    };
  }, [needsFetch, id, attempt, fetchScan]);

  const retry = () => setAttempt((current) => current + 1);

  if (remembered) return { status: 'ready', result: remembered, retry };
  if (needsFetch) {
    const answer = fetched && fetched.id === id && fetched.attempt === attempt ? fetched.state : null;
    return { ...(answer ?? { status: 'loading' as const }), retry };
  }

  // No id: the newest scan of the history, which may still be loading or have failed to load.
  if (history.status === 'loading') return { status: 'loading', retry };
  if (history.status === 'failed') return { status: 'error', kind: 'unknown', retry: () => void history.refresh() };
  return { status: 'not-found', retry };
}
