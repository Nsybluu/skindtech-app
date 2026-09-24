import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { authService, type AuthSession } from '@/services/auth.service';
import { ConsentController, type ConsentSnapshot, type ConsentValue } from '@/services/consent-controller';
import { consentService } from '@/services/consent.service';
import { HistoryController, type HistorySnapshot } from '@/services/history-controller';
import { ProfileController, type ProfileSnapshot, type ProfileStatus } from '@/services/profile-controller';
import { profileService } from '@/services/profile.service';
import { scanHistoryService } from '@/services/scan-history.service';
import { setSessionInvalidatedHandler } from '@/services/session-token.service';
import type { SkinProfile, User } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

type SessionValue = {
  isSessionReady: boolean;
  isSignedIn: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
};

/** The scan history as stored by the backend, plus what the screens can do with it. */
type HistoryValue = Omit<HistorySnapshot, 'nextCursor'> & {
  /** More (older) scans can be loaded. */
  hasMore: boolean;
  /**
   * Reloads the newest page: pull-to-refresh, and "Retry" after a failed first load.
   * Never throws; a failure is reported through `status` / `loadError`.
   */
  refresh: () => Promise<void>;
  /** Loads the next older page. Ignored while another load is running. */
  loadMore: () => Promise<void>;
  /** A scan that just completed in this session: shown first, without duplicating it. */
  add: (result: ScanResult) => void;
  /** A scan from memory only, never from the backend. */
  find: (id: string) => ScanResult | undefined;
  /** A scan from memory, or from `GET /scans/:id`. Rejects with the API error. */
  fetch: (id: string) => Promise<ScanResult>;
  /**
   * Deletes the whole history on the backend, then clears it locally. Resolves `false` when a
   * deletion is already running, rejects (keeping the history) when the backend refused.
   */
  deleteAll: () => Promise<boolean>;
};

type UserDataValue = {
  user: User;
  /** The Skin Profile as stored by the backend (`null`: none saved, or not loaded yet). */
  skinProfile: SkinProfile | null;
  /** True while the profile is being loaded after sign-in or session restore. */
  isSkinProfileLoading: boolean;
  /** True while a profile change is being saved on the backend. */
  isSavingSkinProfile: boolean;
  /** Latest profile, read synchronously (use this when starting a scan). */
  getSkinProfile: () => SkinProfile | null;
  /** Resolves with the profile once its first load finished (retries a failed load). */
  ensureSkinProfile: () => Promise<SkinProfile | null>;
  /**
   * Saves the profile on the backend first. Resolves with what the backend stored (`null` if a
   * save is already running) and rejects when it could not be saved: nothing local changes then.
   */
  saveSkinProfile: (profile: SkinProfile) => Promise<SkinProfile | null>;
  pendingPhotoUri: string | null;
  setPendingPhotoUri: (uri: string | null) => void;
  history: HistoryValue;
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
 * Auth state is restored from the rotating refresh token in SecureStore. Once the tokens are in
 * memory the Skin Profile, AI-training consent and scan history are loaded from the backend.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User>(emptyUser);
  const [profileState, setProfileState] = useState<ProfileSnapshot>({
    profile: null,
    status: 'idle' as ProfileStatus,
    saving: false,
  });
  const [profileController] = useState(
    () =>
      new ProfileController(
        {
          get: () => profileService.getSkinProfile(),
          put: (profile) => profileService.saveSkinProfile(profile),
        },
        setProfileState,
      ),
  );
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [historyState, setHistoryState] = useState<HistorySnapshot>({
    scans: [],
    status: 'idle',
    refreshing: false,
    loadingMore: false,
    nextCursor: null,
    loadError: false,
    deleting: false,
  });
  const [historyController] = useState(
    () =>
      new HistoryController(
        {
          list: ({ cursor }) => scanHistoryService.listScans({ cursor }),
          get: (id) => scanHistoryService.getScan(id),
          deleteAll: () => scanHistoryService.deleteHistory(),
        },
        setHistoryState,
      ),
  );
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
      setPendingPhotoUri(null);
      setIsSignedIn(true);
      // Every way in (email, Google, restored session) has its tokens in memory by now.
      // The loads are independent and none of them is awaited, so a slow backend never holds up
      // signing in. Each one drops answers that belong to an earlier session.
      profileController.reset();
      void profileController.hydrate();
      consentController.reset();
      void consentController.hydrate();
      historyController.reset();
      void historyController.hydrate();
    },
    [consentController, historyController, profileController],
  );

  const signOut = useCallback(() => {
    signedInRef.current = false;
    setIsSignedIn(false);
    setUser(emptyUser);
    setPendingPhotoUri(null);
    profileController.reset();
    consentController.reset();
    historyController.reset();
  }, [consentController, historyController, profileController]);

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

  const ensureSkinProfile = useCallback(() => profileController.ensure(), [profileController]);
  const saveSkinProfile = useCallback(
    (profile: SkinProfile) => profileController.save(profile),
    [profileController],
  );
  const getSkinProfile = useCallback(() => profileController.current, [profileController]);
  const refreshAiConsent = useCallback(() => consentController.hydrate(), [consentController]);
  const saveAiConsent = useCallback(
    (granted: boolean) => consentController.save(granted),
    [consentController],
  );
  const getAiImprovementConsent = useCallback(() => consentController.current, [consentController]);
  const refreshHistory = useCallback(() => historyController.refresh(), [historyController]);
  const loadMoreHistory = useCallback(() => historyController.loadMore(), [historyController]);
  const addScanResult = useCallback((result: ScanResult) => historyController.add(result), [historyController]);
  const findScan = useCallback((id: string) => historyController.find(id), [historyController]);
  const fetchScan = useCallback((id: string) => historyController.loadDetail(id), [historyController]);
  const deleteHistory = useCallback(() => historyController.deleteAll(), [historyController]);

  return (
    <SessionContext.Provider value={{ isSessionReady, isSignedIn, signIn, signOut }}>
      <UserDataContext.Provider
        value={{
          user,
          skinProfile: profileState.profile,
          isSkinProfileLoading: profileState.status === 'loading',
          isSavingSkinProfile: profileState.saving,
          getSkinProfile,
          ensureSkinProfile,
          saveSkinProfile,
          pendingPhotoUri,
          setPendingPhotoUri,
          history: {
            scans: historyState.scans,
            status: historyState.status,
            refreshing: historyState.refreshing,
            loadingMore: historyState.loadingMore,
            loadError: historyState.loadError,
            deleting: historyState.deleting,
            hasMore: historyState.nextCursor !== null,
            refresh: refreshHistory,
            loadMore: loadMoreHistory,
            add: addScanResult,
            find: findScan,
            fetch: fetchScan,
            deleteAll: deleteHistory,
          },
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
