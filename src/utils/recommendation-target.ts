import type { ScanResult } from '@/types/scan';

/**
 * The scan id whose care recommendation should be requested, or `undefined` when there is nothing
 * to ask for. A demo scan (the development fallback) never reached the backend, so it has no
 * recommendation there and must not trigger a request.
 */
export function recommendationTarget(result: Pick<ScanResult, 'id' | 'isDemoData'> | undefined): string | undefined {
  return result && !result.isDemoData ? result.id : undefined;
}
