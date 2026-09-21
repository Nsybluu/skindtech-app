import { API_BASE_URL, API_TIMEOUT_MS } from './api-config';
import { ApiError } from './api-error';
import { getAccessToken, refreshAccessToken } from './session-token.service';

export { ApiError };

type ApiErrorPayload = {
  error?: {
    code?: string;
    details?: unknown;
  };
};

type ApiRequestOptions = {
  authenticated?: boolean;
  retryAuthentication?: boolean;
};

/** Resolves with `value` after `ms`, mimicking a network round trip. */
export function mockResponse<T>(value: T, ms = 0): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function readApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // An upstream proxy can return an HTML/plain-text error page.
  }
  return new ApiError(
    response.status,
    payload?.error?.code || `HTTP_${response.status}`,
    payload?.error?.details,
  );
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const authenticated = options.authenticated ?? true;
  const retryAuthentication = options.retryAuthentication ?? true;

  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const tokenUsed = authenticated ? getAccessToken() : null;
    if (tokenUsed) headers.set('Authorization', `Bearer ${tokenUsed}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401 && authenticated && retryAuthentication) {
      // The server kills the previous access token as soon as the session is
      // rotated, so a request that was already in flight when another one
      // refreshed gets a 401 for a perfectly healthy session. In that case the
      // newer token is already in memory: retry with it instead of refreshing
      // (and rotating) a second time.
      const latestToken = getAccessToken();
      const usableToken =
        latestToken && latestToken !== tokenUsed ? latestToken : await refreshAccessToken();
      if (usableToken) {
        clearTimeout(timeout);
        return apiRequest<T>(path, init, { authenticated: true, retryAuthentication: false });
      }
    }

    if (!response.ok) {
      throw await readApiError(response);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}
