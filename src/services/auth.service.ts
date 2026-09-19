import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { SkinProfile, User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

import { apiRequest } from './api';
import {
  clearAuthTokens,
  getStoredRefreshToken,
  refreshAccessToken,
  storeAuthTokens,
  type AuthTokens,
} from './session-token.service';

/** What the app needs right after authentication (user + bootstrap data). */
export type AuthSession = {
  user: User;
  skinProfile: SkinProfile | null;
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

function toSession(user: AuthUserPayload): AuthSession {
  return {
    user: { id: user.id, name: user.displayName, email: user.email },
    skinProfile: null,
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

async function authenticate(path: '/auth/login' | '/auth/register', email: string, password: string) {
  const response = await apiRequest<AuthResponse>(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ email, password, device: deviceInfo() }),
    },
    { authenticated: false },
  );
  await storeAuthTokens(response.data);
  return toSession(response.data.user);
}

/** A freshly authenticated account has no hydrated Phase 4/5 data yet. */
const emptySession = (user: AuthUserPayload): AuthSession => ({
  user: { id: user.id, name: user.displayName, email: user.email },
  skinProfile: null,
  scanHistory: [],
});

export const authService = {
  signInWithEmail(email: string, password: string) {
    return authenticate('/auth/login', email, password);
  },
  signUpWithEmail(email: string, password: string) {
    return authenticate('/auth/register', email, password);
  },
  async restoreSession(): Promise<AuthSession | null> {
    if (!(await refreshAccessToken())) return null;
    const response = await apiRequest<MeResponse>('/auth/me');
    return emptySession(response.data.user);
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
