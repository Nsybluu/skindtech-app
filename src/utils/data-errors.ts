import type { Translations } from '@/i18n/en';
import { apiErrorKind, type ApiErrorKind } from '@/services/api-error-kind';

/** A friendly sentence for a failed history / privacy request. Never includes technical detail. */
export function dataErrorMessageForKind(kind: ApiErrorKind, t: Translations): string {
  switch (kind) {
    case 'network':
      return t.dataErrors.network;
    case 'session':
      return t.dataErrors.session;
    case 'storage':
      return t.dataErrors.storageUnavailable;
    default:
      return t.dataErrors.generic;
  }
}

export function dataErrorMessage(error: unknown, t: Translations): string {
  return dataErrorMessageForKind(apiErrorKind(error), t);
}
