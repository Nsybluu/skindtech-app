import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { authService, type AuthSession } from '@/services/auth.service';
import { ConsentController, type ConsentSnapshot, type ConsentValue } from '@/services/consent-controller';
import { consentService } from '@/services/consent.service';
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
  /**
   * Whether scan photos may be saved to improve the AI, as confirmed by the backend.
   * `null` means not granted or not asked yet: the consent sheet asks.
   */
  aiImprovementConsent: ConsentValue;
  /** True while a consent choice is being saved on the backend. */
  isSavingConsent: boolean;
  /** Latest confirmed value, read synchronously (use this when starting a scan). */
  getAiImprovementConsent: () => ConsentValue;
  /** Re-reads the saved choice from the backend. Failures keep the current value. */
  refreshAiConsent: () => Promise<void>;
  /**
   * Saves the user's choice on the backend before anything depends on it. Resolves with the
   * confirmed value (`null` if a save is already running), rejects when it could not be saved.
   */
  saveAiConsent: (granted: boolean) => Promise<boolean | null>;
};

const SessionContext = createContext<SessionValue | null>(null);
const UserDataContext = createContext<UserDataValue | null>(null);

const emptyUser: User = { id: '', name: '', email: '' };

/**
 * How long the splash screen may wait for the saved session to be restored.
 * After this the app shows the sign-in screens and the restore keeps going in
 * the background: it is deliberately NOT aborted, because cancelling a refresh
 * the server has already rotated would lose the new token and sign the user out.
 */
const SESSION_BOOT_MAX_MS = 6_000;

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
  const [consent, setConsent] = useState<ConsentSnapshot>({ value: null, saving: false });
  const [consentController] = useState(
    () =>
      new ConsentController(
        { get: () => consentService.getAiTraining(), put: (granted) => consentService.setAiTraining(granted) },
        setConsent,
      ),
  );
  // Mirrors `isSignedIn` for the async restore below, which would otherwise read a stale value.
  const signedInRef = useRef(false);

  const signIn = useCallback(
    (session: AuthSession) => {
      signedInRef.current = true;
      setUser(session.user);
      setSkinProfile(session.skinProfile);
      setPendingPhotoUri(null);
      setScanHistory(session.scanHistory);
      setIsSignedIn(true);
      // Every way in (email, Google, restored session) has its tokens in memory by now.
      consentController.reset();
      void consentController.hydrate();
    },
    [consentController],
  );

  const signOut = useCallback(() => {
    signedInRef.current = false;
    setIsSignedIn(false);
    setUser(emptyUser);
    setSkinProfile(null);
    setPendingPhotoUri(null);
    setScanHistory([]);
    consentController.reset();
  }, [consentController]);

  useEffect(() => {
    let active = true;
    setSessionInvalidatedHandler(signOut);

    // A slow or unreachable backend must not keep the app on the splash screen.
    const releaseSplash = setTimeout(() => {
      if (active) setIsSessionReady(true);
    }, SESSION_BOOT_MAX_MS);

    void authService
      .restoreSession()
      .then((session) => {
        // If the user already signed in by hand while this was running, that
        // session wins: never replace it with the one that was being restored.
        if (active && session && !signedInRef.current) signIn(session);
      })
      .catch(() => {
        // A network error leaves the user signed out without exposing technical details.
        // The refresh token stays in the Keychain, so the next launch can retry.
      })
      .finally(() => {
        clearTimeout(releaseSplash);
        if (active) setIsSessionReady(true);
      });

    return () => {
      active = false;
      clearTimeout(releaseSplash);
      setSessionInvalidatedHandler(null);
    };
  }, [signIn, signOut]);

  const refreshAiConsent = useCallback(() => consentController.hydrate(), [consentController]);
  const saveAiConsent = useCallback(
    (granted: boolean) => consentController.save(granted),
    [consentController],
  );
  const getAiImprovementConsent = useCallback(() => consentController.current, [consentController]);

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
          aiImprovementConsent: consent.value,
          isSavingConsent: consent.saving,
          getAiImprovementConsent,
          refreshAiConsent,
          saveAiConsent,
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
