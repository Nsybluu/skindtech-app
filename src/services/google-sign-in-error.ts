/** Why the on-device part of Google Sign-In failed (the user closing the dialog is not one of them). */
export type GoogleSignInFailure =
  /** The native module is missing, e.g. the app runs in Expo Go instead of a development build. */
  | 'unsupported'
  /** Google Play services is missing or out of date (Android). */
  | 'play-services'
  /** The device has no Google account to choose from. */
  | 'no-account'
  /** The OAuth setup does not match this build (wrong SHA-1, package name or client ID). */
  | 'misconfigured'
  | 'failed';

/**
 * Kept free of React Native imports so message mapping and its tests can depend
 * on it, like `ApiError`.
 */
export class GoogleSignInClientError extends Error {
  constructor(readonly reason: GoogleSignInFailure) {
    super(`GOOGLE_SIGN_IN_${reason.toUpperCase().replace(/-/g, '_')}`);
    this.name = 'GoogleSignInClientError';
  }
}
