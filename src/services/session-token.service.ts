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

export function setSessionInvalidatedHandler(handler: (() => void) | null): void {
  sessionInvalidatedHandler = handler;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(refreshTokenKey, secureStoreOptions);
}

export async function storeAuthTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  await SecureStore.setItemAsync(refreshTokenKey, tokens.refreshToken, secureStoreOptions);
}

export async function clearAuthTokens(): Promise<void> {
  accessToken = null;
  await SecureStore.deleteItemAsync(refreshTokenKey, secureStoreOptions);
}

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    if (response.status === 401) {
      await clearAuthTokens();
      sessionInvalidatedHandler?.();
      return null;
    }
    if (!response.ok) {
      throw new Error(`Session refresh failed with status ${response.status}`);
    }

    const payload = (await response.json()) as RefreshResponse;
    await storeAuthTokens(payload.data);
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
