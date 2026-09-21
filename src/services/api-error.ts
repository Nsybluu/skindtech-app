/**
 * Error thrown for every failed API call. Kept free of React Native imports so
 * pure helpers (and their tests) can depend on it.
 *
 * `statusCode` is 0 when the request never reached the server (offline, DNS,
 * timeout, aborted).
 */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}
