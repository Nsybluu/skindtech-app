import { apiErrorKind, type ApiErrorKind } from './api-error-kind';

export type AccountDeletionSnapshot = {
  /** A delete request is running: every button that could start another one is locked. */
  busy: boolean;
  /** The backend asked for the account password: the password step is open. */
  needsPassword: boolean;
};

export type AccountDeletionResult =
  | { status: 'deleted' }
  | { status: 'needs-password' }
  | { status: 'failed'; kind: ApiErrorKind }
  /** Ignored: another request is running, or the call does not fit the current step. */
  | { status: 'busy' };

export type AccountDeletionApi = {
  deleteAccount: (password?: string) => Promise<void>;
};

/** The backend accepts passwords of 8 to 128 characters; anything else cannot be right. */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * The "delete my account" flow, free of React so its rules can be tested with a fake API.
 *
 * 1. `start()` asks the backend without a password (works for Google accounts).
 * 2. If the backend answers `INVALID_CREDENTIALS` the account has a password: `needsPassword`
 *    opens the password step and `submitPassword()` retries with it.
 * 3. Only a 204 ends the flow (`onDeleted`, which signs out locally). Every failure leaves the
 *    user signed in and all local data untouched.
 *
 * One request at a time. The password is only ever an argument: it is never stored here.
 */
export class AccountDeletionController {
  private busy = false;
  private needsPassword = false;

  constructor(
    private readonly api: AccountDeletionApi,
    /** The account is gone: clear local state and leave the signed-in screens. */
    private readonly onDeleted: () => void,
    private readonly onChange: (snapshot: AccountDeletionSnapshot) => void,
  ) {}

  /** First attempt, without a password. */
  start(): Promise<AccountDeletionResult> {
    if (this.busy || this.needsPassword) return Promise.resolve({ status: 'busy' });
    return this.attempt(undefined);
  }

  /** Second attempt, from the password step. */
  submitPassword(password: string): Promise<AccountDeletionResult> {
    if (this.busy || !this.needsPassword) return Promise.resolve({ status: 'busy' });
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      // The backend would reject it as malformed; it can never match, so do not send it at all.
      return Promise.resolve({ status: 'failed', kind: 'invalid-credentials' });
    }
    return this.attempt(password);
  }

  /** Closes the password step. Ignored while a request is running. */
  cancel(): void {
    if (this.busy || !this.needsPassword) return;
    this.needsPassword = false;
    this.publish();
  }

  private async attempt(password: string | undefined): Promise<AccountDeletionResult> {
    this.busy = true;
    this.publish();

    try {
      await this.api.deleteAccount(password);
    } catch (error) {
      const kind = apiErrorKind(error);
      this.busy = false;
      if (password === undefined && kind === 'invalid-credentials') {
        this.needsPassword = true;
        this.publish();
        return { status: 'needs-password' };
      }
      this.publish();
      return { status: 'failed', kind };
    }

    this.needsPassword = false;
    this.onDeleted();
    this.busy = false;
    this.publish();
    return { status: 'deleted' };
  }

  private publish(): void {
    this.onChange({ busy: this.busy, needsPassword: this.needsPassword });
  }
}
