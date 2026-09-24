import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

import { apiRequest } from './api';
import {
  clearAuthTokens,
  getStoredRefreshToken,
  refreshAccessToken,
  storeAuthTokens,
  type AuthTokens,
} from './session-token.service';

/**
 * What the app needs right after authentication. The Skin Profile is not part of it: the
 * provider loads it from `GET /profile/skin` once the access token is in memory.
 */
export type AuthSession = {
  user: User;
  scanHistory: ScanResult[];
};

type AuthUserPayload = {
  id: string;
  email: string;
  displayName: string;
};

type AuthResponse = {
  status: 'success';
  data: AuthTokens & {
    user: AuthUserPayload;
    accessTokenExpiresIn: number;
  };
};

type MeResponse = {
  status: 'success';
  data: { user: AuthUserPayload };
};

/** Scan history is hydrated in a later phase. */
function toSession(user: AuthUserPayload): AuthSession {
  return {
    user: { id: user.id, name: user.displayName, email: user.email },
    scanHistory: [],
  };
}

function deviceInfo() {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
    ? Platform.OS
    : 'unknown';
  return {
    platform,
    ...(Device.modelName ? { deviceName: Device.modelName } : {}),
  };
}

type AuthEndpoint = '/auth/login' | '/auth/register' | '/auth/google';

/** Every sign-in path returns the same tokens, which go through the one session layer. */
async function authenticate(path: AuthEndpoint, credentials: Record<string, string>) {
  const response = await apiRequest<AuthResponse>(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ ...credentials, device: deviceInfo() }),
    },
    { authenticated: false },
  );
  await storeAuthTokens(response.data);
  return toSession(response.data.user);
}

export const authService = {
  signInWithEmail(email: string, password: string) {
    return authenticate('/auth/login', { email, password });
  },
  signUpWithEmail(email: string, password: string) {
    return authenticate('/auth/register', { email, password });
  },
  /** `idToken` is the Google ID token from the native dialog; the backend verifies it. */
  signInWithGoogle(idToken: string) {
    return authenticate('/auth/google', { idToken });
  },
  async restoreSession(): Promise<AuthSession | null> {
    if (!(await refreshAccessToken())) return null;
    const response = await apiRequest<MeResponse>('/auth/me');
    return toSession(response.data.user);
  },
  async signOut(): Promise<void> {
    const refreshToken = await getStoredRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest(
          '/auth/logout',
          { method: 'POST', body: JSON.stringify({ refreshToken }) },
          { authenticated: false },
        );
      }
    } catch {
      // Local sign-out must still complete when the backend is unreachable.
    } finally {
      await clearAuthTokens();
    }
  },
};
