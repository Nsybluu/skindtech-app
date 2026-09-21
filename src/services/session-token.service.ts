import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL, API_TIMEOUT_MS } from './api-config';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RefreshResponse = {
  status: 'success';
  data: AuthTokens;
};

const refreshTokenKey = 'skindtech.refresh-token';
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let sessionInvalidatedHandler: (() => void) | null = null;

/**
 * Bumped whenever the credentials are replaced or cleared by the user
 * (sign-in, sign-up, sign-out). A refresh that started under an older epoch is
 * stale: writing its result would resurrect a session the user just ended, or
 * overwrite the tokens of the account they just signed in to.
 */
let sessionEpoch = 0;

export function setSessionInvalidatedHandler(handler: (() => void) | null): void {
  sessionInvalidatedHandler = handler;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(refreshTokenKey, secureStoreOptions);
}

async function persistTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(refreshTokenKey, tokens.refreshToken, secureStoreOptions);
}

/** Stores the tokens of a fresh sign-in or sign-up and invalidates in-flight refreshes. */
export async function storeAuthTokens(tokens: AuthTokens): Promise<void> {
  sessionEpoch += 1;
  await persistTokens(tokens);
}

export async function clearAuthTokens(): Promise<void> {
  sessionEpoch += 1;
  accessToken = null;
  await SecureStore.deleteItemAsync(refreshTokenKey, secureStoreOptions);
}

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;

  const epoch = sessionEpoch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    // The user signed in or out while this request was in flight: the answer
    // belongs to a session that no longer matters, so drop it.
    if (epoch !== sessionEpoch) return null;

    if (response.status === 401) {
      await clearAuthTokens();
      sessionInvalidatedHandler?.();
      return null;
    }
    if (!response.ok) {
      throw new Error(`Session refresh failed with status ${response.status}`);
    }

    const payload = (await response.json()) as RefreshResponse;
    if (epoch !== sessionEpoch) return null;

    await persistTokens(payload.data);
    return payload.data.accessToken;
  } finally {
    clearTimeout(timeout);
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
