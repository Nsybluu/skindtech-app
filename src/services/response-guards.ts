import { ApiError } from './api-error';

/** What every strict response parser throws: the backend answered, but not with the agreed shape. */
export const invalidResponse = () => new ApiError(502, 'INVALID_RESPONSE');

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** A non-blank string, trimmed of nothing: callers decide whether to trim before showing it. */
export const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** The value if it is one of `allowed`, otherwise an INVALID_RESPONSE error. */
export function oneOf<T extends string>(allowed: readonly T[], value: unknown): T {
  if (!allowed.includes(value as T)) throw invalidResponse();
  return value as T;
}

/** A non-empty array whose every item is one of `allowed`. */
export function arrayOf<T extends string>(allowed: readonly T[], value: unknown, options: { allowEmpty?: boolean } = {}): T[] {
  if (!Array.isArray(value)) throw invalidResponse();
  if (value.length === 0 && !options.allowEmpty) throw invalidResponse();
  return value.map((item) => oneOf(allowed, item));
}
