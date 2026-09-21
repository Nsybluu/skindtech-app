import type { ScanFailureReason } from '@/types/scan';

import { ApiError } from './api-error';

/**
 * Backend codes that mean "the photo itself is the problem" and should send the
 * user to the Photo needs attention screen (07B) instead of Analysis failed (07D).
 */
const IMAGE_PROBLEM_CODES: ReadonlySet<string> = new Set([
  'AI_REJECTED_IMAGE',
  'LIMIT_FILE_SIZE',
  'LIMIT_UNEXPECTED_FILE',
  'IMAGE_REQUIRED',
]);

/** Turns whatever went wrong during `POST /scans` into a reason the UI can act on. */
export function classifyScanFailure(error: unknown): ScanFailureReason {
  if (!(error instanceof ApiError)) return 'unknown';

  // The image check runs first: the backend currently answers 502 for a rejected
  // photo, which would otherwise be mistaken for "service unavailable".
  if (IMAGE_PROBLEM_CODES.has(error.code)) return 'image-rejected';
  if (error.statusCode === 0 || error.code === 'NETWORK_ERROR') return 'network';
  if (error.statusCode === 401) return 'session';
  if (error.statusCode === 429) return 'rate-limited';
  if (error.statusCode >= 500) return 'unavailable';
  return 'unknown';
}

/** Only these failures may be papered over by the development demo fallback. */
export function isConnectivityFailure(reason: ScanFailureReason): boolean {
  return reason === 'network' || reason === 'unavailable';
}
