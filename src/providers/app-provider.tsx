import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { authService, type AuthSession } from '@/services/auth.service';
import { setSessionInvalidatedHandler } from '@/services/session-token.service';
import type { SkinProfile, User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

type SessionValue = {
  isSessionReady: boolean;
  isSignedIn: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

type UserDataValue = {
  user: User;
  skinProfile: SkinProfile | null;
  setSkinProfile: (profile: SkinProfile) => void;
  pendingPhotoUri: string | null;
  setPendingPhotoUri: (uri: string | null) => void;
  scanHistory: ScanResult[];
  addScanResult: (result: ScanResult) => void;
  clearScanHistory: () => void;
  getScanResult: (id: string) => ScanResult | undefined;
  /** `null` until the user answers the AI-improvement consent sheet. */
  aiImprovementConsent: boolean | null;
  setAiImprovementConsent: (allowed: boolean) => void;
};

const SessionContext = createContext<SessionValue | null>(null);
const UserDataContext = createContext<UserDataValue | null>(null);

const emptyUser: User = { id: '', name: '', email: '' };

/**
 * Auth state is restored from the rotating refresh token in SecureStore.
 * Profile and scan history are hydrated in their later backend phases.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User>(emptyUser);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [aiImprovementConsent, setAiImprovementConsent] = useState<boolean | null>(null);

  const signIn = (session: AuthSession) => {
    setUser(session.user);
    setSkinProfile(session.skinProfile);
    setPendingPhotoUri(null);
    setScanHistory(session.scanHistory);
    setAiImprovementConsent(null);
    setIsSignedIn(true);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setUser(emptyUser);
    setSkinProfile(null);
    setPendingPhotoUri(null);
    setScanHistory([]);
    setAiImprovementConsent(null);
  };

  useEffect(() => {
    let active = true;
    setSessionInvalidatedHandler(signOut);
    void authService
      .restoreSession()
      .then((session) => {
        if (active && session) signIn(session);
      })
      .catch(() => {
        // A network error leaves the user signed out without exposing technical details.
      })
      .finally(() => {
        if (active) setIsSessionReady(true);
      });

    return () => {
      active = false;
      setSessionInvalidatedHandler(null);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ isSessionReady, isSignedIn, signIn, signOut }}>
      <UserDataContext.Provider
        value={{
          user,
          skinProfile,
          setSkinProfile,
          pendingPhotoUri,
          setPendingPhotoUri,
          scanHistory,
          addScanResult: (result) => setScanHistory((current) => [result, ...current]),
          clearScanHistory: () => setScanHistory([]),
          getScanResult: (id) => scanHistory.find((scan) => scan.id === id),
          aiImprovementConsent,
          setAiImprovementConsent,
        }}>
        {children}
      </UserDataContext.Provider>
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside <AppProvider>');
  }
  return context;
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used inside <AppProvider>');
  }
  return context;
}
