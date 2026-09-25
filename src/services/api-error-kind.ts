import { ApiError } from './api-error';

/** What a failed data request means for the user, whatever the endpoint. */
export type ApiErrorKind =
  /** The request never reached the backend (offline, DNS, timeout). */
  | 'network'
  /** The session is no longer valid; the app signs the user out on its own. */
  | 'session'
  /** `SCAN_NOT_FOUND` / `RECOMMENDATION_NOT_FOUND`: nothing of that kind for this account. */
  | 'not-found'
  /** `STORAGE_UNAVAILABLE`: the backend could not remove the stored photos, so it deleted nothing. */
  | 'storage'
  /** `INVALID_CREDENTIALS`: the password sent to confirm the action was wrong. */
  | 'invalid-credentials'
  | 'unknown';

export function apiErrorKind(error: unknown): ApiErrorKind {
  if (!(error instanceof ApiError)) return 'unknown';
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'network';
    case 'SCAN_NOT_FOUND':
    case 'RECOMMENDATION_NOT_FOUND':
      return 'not-found';
    case 'STORAGE_UNAVAILABLE':
      return 'storage';
    case 'INVALID_CREDENTIALS':
      return 'invalid-credentials';
    default:
      return error.statusCode === 401 ? 'session' : 'unknown';
  }
}
