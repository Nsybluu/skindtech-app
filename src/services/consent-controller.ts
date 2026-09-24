/**
 * `true` = the backend confirmed consent, `false` = the user declined in this session,
 * `null` = not granted or not asked yet (the consent sheet must ask).
 */
export type ConsentValue = boolean | null;

export type ConsentSnapshot = { value: ConsentValue; saving: boolean };

export type ConsentApi = {
  get: () => Promise<boolean>;
  put: (granted: boolean) => Promise<boolean>;
};

/**
 * The backend answers `false` both for "declined" and "never asked". A server `false`
 * therefore becomes a remembered "declined" only when the user said so in this session;
 * otherwise it stays `null` so the consent sheet still asks. Consent is never assumed.
 */
export function reconcileConsent(current: ConsentValue, granted: boolean): ConsentValue {
  if (granted) return true;
  return current === false ? false : null;
}

/**
 * Keeps the AI-training consent in step with the backend. Kept free of React so the
 * rules can be tested with a fake API; the provider only renders its snapshots.
 *
 * - the value changes only after the backend confirmed it;
 * - a failed save leaves the value untouched and rethrows;
 * - one save at a time, extra calls return `null`;
 * - answers that belong to an earlier session, or that may predate a save, are dropped.
 */
export class ConsentController {
  private value: ConsentValue = null;
  private saving = false;
  /** Bumped by `reset()` so results from a previous session are ignored. */
  private session = 0;
  /** Bumped when a save starts and ends so a read that may predate the write is ignored. */
  private writes = 0;

  constructor(
    private readonly api: ConsentApi,
    private readonly onChange: (snapshot: ConsentSnapshot) => void,
  ) {}

  /** Latest confirmed value, readable synchronously (never stale by a render). */
  get current(): ConsentValue {
    return this.value;
  }

  /** Sign-in and sign-out: forget everything, including requests still in flight. */
  reset(): void {
    this.session += 1;
    this.writes += 1;
    this.value = null;
    this.saving = false;
    this.publish();
  }

  /** Loads the saved choice after sign-in or session restore. Failures keep the current value. */
  async hydrate(): Promise<void> {
    const session = this.session;
    const writes = this.writes;
    let granted: boolean;
    try {
      granted = await this.api.get();
    } catch {
      return;
    }
    if (session !== this.session || writes !== this.writes) return;
    this.value = reconcileConsent(this.value, granted);
    this.publish();
  }

  /**
   * Saves the choice on the backend first. Resolves with the confirmed value, or `null`
   * when another save is running or the session ended meanwhile. Rejects when it failed.
   */
  async save(granted: boolean): Promise<boolean | null> {
    if (this.saving) return null;
    const session = this.session;
    this.saving = true;
    this.writes += 1;
    this.publish();

    try {
      const confirmed = await this.api.put(granted);
      if (session !== this.session) return null;
      this.value = confirmed;
      return confirmed;
    } finally {
      if (session === this.session) {
        this.saving = false;
        this.writes += 1;
        this.publish();
      }
    }
  }

  private publish(): void {
    this.onChange({ value: this.value, saving: this.saving });
  }
}
