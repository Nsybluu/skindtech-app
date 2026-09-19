import type { Translations } from '@/i18n/en';
import { ApiError } from '@/services/api';

export function authErrorMessage(error: unknown, t: Translations): string {
  if (!(error instanceof ApiError)) return t.authErrors.generic;

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return t.authErrors.invalidCredentials;
    case 'EMAIL_ALREADY_IN_USE':
      return t.authErrors.emailAlreadyInUse;
    case 'TOO_MANY_REQUESTS':
      return t.authErrors.tooManyRequests;
    case 'VALIDATION_ERROR':
      return t.authErrors.invalidInput;
    case 'NETWORK_ERROR':
      return t.authErrors.network;
    default:
      return t.authErrors.generic;
  }
}
