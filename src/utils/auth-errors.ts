import type { Translations } from '@/i18n/en';
import { ApiError } from '@/services/api';
import { GoogleSignInClientError } from '@/services/google-sign-in-error';

/** `context: 'google'` words errors for the Google button instead of the email form. */
export function authErrorMessage(error: unknown, t: Translations, context?: 'google'): string {
  if (error instanceof GoogleSignInClientError) return googleClientErrorMessage(error, t);
  if (!(error instanceof ApiError)) return t.authErrors.generic;

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return t.authErrors.invalidCredentials;
    case 'EMAIL_ALREADY_IN_USE':
      return t.authErrors.emailAlreadyInUse;
    case 'TOO_MANY_REQUESTS':
      return t.authErrors.tooManyRequests;
    case 'VALIDATION_ERROR':
      // The email form's wording ("check your email and password") does not fit a Google token.
      return context === 'google' ? t.authErrors.googleInvalidToken : t.authErrors.invalidInput;
    case 'INVALID_GOOGLE_TOKEN':
      return t.authErrors.googleInvalidToken;
    case 'GOOGLE_SIGN_IN_UNAVAILABLE':
      return t.authErrors.googleUnavailable;
    case 'ACCOUNT_LINK_REQUIRED':
      return t.authErrors.accountLinkRequired;
    case 'NETWORK_ERROR':
      return t.authErrors.network;
    default:
      return t.authErrors.generic;
  }
}

function googleClientErrorMessage(error: GoogleSignInClientError, t: Translations): string {
  switch (error.reason) {
    case 'unsupported':
      return t.authErrors.googleNeedsDevBuild;
    case 'play-services':
      return t.authErrors.googlePlayServices;
    case 'no-account':
      return t.authErrors.googleNoAccount;
    case 'misconfigured':
      return t.authErrors.googleMisconfigured;
    default:
      return t.authErrors.generic;
  }
}
