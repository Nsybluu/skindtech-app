import { API_BASE_URL, API_TIMEOUT_MS } from './api-config';
import { getAccessToken, refreshAccessToken } from './session-token.service';

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
    const token = authenticated ? getAccessToken() : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401 && authenticated && retryAuthentication) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
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
