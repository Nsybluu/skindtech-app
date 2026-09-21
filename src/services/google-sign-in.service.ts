import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/constants/google-auth';

import { GoogleSignInClientError } from './google-sign-in-error';

export type GoogleSignInResult =
  | { status: 'success'; idToken: string }
  /** The user closed the Google dialog. That is a choice, not an error. */
  | { status: 'cancelled' };

type GoogleSignInModule = typeof import('react-native-nitro-google-signin');

let configured = false;

/**
 * The native module only exists in a development / production build. Loading it
 * lazily keeps the rest of the app usable in Expo Go: only tapping the Google
 * button fails there, with a clear message, instead of the whole app crashing at start-up.
 */
async function loadGoogleSignIn(): Promise<GoogleSignInModule> {
  try {
    return await import('react-native-nitro-google-signin');
  } catch {
    throw new GoogleSignInClientError('unsupported');
  }
}

/**
 * Opens the native Google account chooser and returns a Google ID token whose
 * audience is the Web client ID. The backend verifies it (`POST /auth/google`).
 *
 * Android uses Credential Manager ("Sign in with Google"), iOS the Google Sign-In SDK.
 * Throws `GoogleSignInClientError`; a cancelled dialog resolves as `{ status: 'cancelled' }`.
 */
export async function requestGoogleIdToken(): Promise<GoogleSignInResult> {
  const google = await loadGoogleSignIn();
  const {
    GoogleOneTapSignIn,
    isCancelledResponse,
    isErrorWithCode,
    isNoSavedCredentialFoundResponse,
    isSuccessResponse,
    statusCodes,
  } = google;

  try {
    if (!configured) {
      GoogleOneTapSignIn.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
      });
      configured = true;
    }

    await GoogleOneTapSignIn.checkPlayServices();
    const response = await GoogleOneTapSignIn.presentExplicitSignIn();

    if (isCancelledResponse(response)) return { status: 'cancelled' };
    if (isNoSavedCredentialFoundResponse(response)) throw new GoogleSignInClientError('no-account');
    if (isSuccessResponse(response) && response.data.idToken) {
      return { status: 'success', idToken: response.data.idToken };
    }
    throw new GoogleSignInClientError('failed');
  } catch (error) {
    if (error instanceof GoogleSignInClientError) throw error;

    const code = isErrorWithCode(error) ? error.code : null;
    if (code === statusCodes.SIGN_IN_CANCELLED) return { status: 'cancelled' };

    // Log the failure kind only: never the token or the account details.
    console.warn('Google Sign-In failed', code ?? (error instanceof Error ? error.name : 'unknown'));

    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInClientError('play-services');
    if (code === statusCodes.DEVELOPER_ERROR) throw new GoogleSignInClientError('misconfigured');
    throw new GoogleSignInClientError('failed');
  }
}
