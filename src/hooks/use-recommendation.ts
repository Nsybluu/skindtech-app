import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useUserData } from '@/providers/app-provider';
import type { RecommendationState } from '@/services/recommendation-controller';

/**
 * How long after a rules-only answer the one background refresh runs. The language model needs a
 * few seconds to write its personalization; asking sooner would almost always get the same answer.
 */
export const RECOMMENDATION_REFRESH_DELAY_MS = 10_000;

/**
 * The care recommendation of one scan, from the backend. Pass `undefined` for a scan that has no
 * recommendation to ask for (demo data): nothing is requested and the state stays `idle`.
 *
 * - loads once per scan (single-flight, so two components asking share one request);
 * - the state belongs to the scan id it was asked for, so switching scans can never show, or be
 *   overwritten by, another scan's answer;
 * - a rules-only answer is refreshed in the background ONE time to pick up the language-model
 *   personalization; leaving the screen cancels the wait. No polling.
 */
export function useRecommendation(scanId: string | undefined): {
  state: RecommendationState;
  retry: () => void;
} {
  const { recommendations } = useUserData();
  const getSnapshot = useCallback(() => recommendations.get(scanId), [recommendations, scanId]);
  const state = useSyncExternalStore(recommendations.subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (scanId) void recommendations.load(scanId);
  }, [recommendations, scanId]);

  // `state` changes when the first answer arrives; that is what schedules the single refresh.
  useEffect(() => {
    if (!scanId || state.status !== 'ready' || !recommendations.needsRefresh(scanId)) return;
    const timer = setTimeout(() => void recommendations.refreshOnce(scanId), RECOMMENDATION_REFRESH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [recommendations, scanId, state]);

  const retry = useCallback(() => {
    if (scanId) void recommendations.retry(scanId);
  }, [recommendations, scanId]);

  return { state, retry };
}
