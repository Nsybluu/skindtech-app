import { apiRequest } from './api';
import { clearAuthTokens } from './session-token.service';

/** The account owner's own data controls. */
export const accountService = {
  /**
   * Deletes the account and all its data on the backend. Google (passwordless) accounts confirm
   * with an empty body; email accounts must send their `password`, otherwise the backend answers
   * `INVALID_CREDENTIALS`. Resolves only after the backend confirmed with 204.
   *
   * After a 204 there is no session left to log out of, so the logout endpoint is NOT called:
   * only the local copies of the tokens are dropped. Any failure leaves the tokens untouched.
   */
  async deleteAccount(password?: string): Promise<void> {
    await apiRequest<void>('/account', {
      method: 'DELETE',
      body: JSON.stringify(password === undefined ? {} : { password }),
    });

    try {
      await clearAuthTokens();
    } catch {
      // The tokens are already dead on the backend, and the in-memory access token is cleared first.
    }
  },
};
