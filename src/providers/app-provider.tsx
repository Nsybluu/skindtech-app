import { createContext, useContext, useState, type ReactNode } from 'react';

import { mockUser } from '@/mocks/user';
import type { AuthSession } from '@/services/auth.service';
import type { SkinProfile, User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

type SessionValue = {
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

/**
 * In-memory mock app state (auth + the signed-in user's data).
 *
 * User data is kept after sign-out so screens that are still animating out
 * never read an empty user; it is replaced on the next sign-in.
 * TODO(api): hydrate from the Express API and persist the auth token.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User>(mockUser);
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

  return (
    <SessionContext.Provider value={{ isSignedIn, signIn, signOut: () => setIsSignedIn(false) }}>
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
