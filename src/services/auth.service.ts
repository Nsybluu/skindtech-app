import { mockScanHistory } from '@/mocks/history';
import { mockSkinProfile } from '@/mocks/profile';
import { mockUser } from '@/mocks/user';
import type { SkinProfile, User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

import { mockResponse } from './api';

/** What the app needs right after authentication (user + bootstrap data). */
export type AuthSession = {
  user: User;
  skinProfile: SkinProfile | null;
  scanHistory: ScanResult[];
};

const returningUserSession = (): AuthSession => ({
  user: mockUser,
  skinProfile: mockSkinProfile,
  scanHistory: mockScanHistory,
});

/** A freshly created account has no Skin Profile, so the first scan asks for one. */
const newUserSession = (email: string): AuthSession => ({
  user: { ...mockUser, email: email.trim() || mockUser.email },
  skinProfile: null,
  scanHistory: [],
});

// TODO(api): POST /auth/sign-in, /auth/sign-up, /auth/google via Express.
export const authService = {
  signInWithEmail(_email: string, _password: string) {
    return mockResponse(returningUserSession());
  },
  signInWithGoogle() {
    return mockResponse(returningUserSession());
  },
  signUpWithEmail(email: string, _password: string) {
    return mockResponse(newUserSession(email));
  },
  signUpWithGoogle() {
    return mockResponse(newUserSession(''));
  },
  signOut() {
    return mockResponse(undefined);
  },
};
