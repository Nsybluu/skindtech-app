import type { SkinProfile } from '@/types/profile';

/**
 * `idle`: not signed in, `loading`: first load after sign-in or restore,
 * `ready`: the backend answered (the profile may still be `null`), `failed`: the load failed.
 */
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type ProfileSnapshot = {
  profile: SkinProfile | null;
  status: ProfileStatus;
  saving: boolean;
};

export type ProfileApi = {
  get: () => Promise<SkinProfile | null>;
  put: (profile: SkinProfile) => Promise<SkinProfile>;
};

/**
 * Keeps the Skin Profile in step with the backend. Free of React so the rules can be
 * tested with a fake API; the provider only renders its snapshots.
 *
 * - the profile changes only with what the backend returned;
 * - a failed save leaves the current profile untouched and rethrows;
 * - one save at a time, extra calls return `null`;
 * - answers that belong to an earlier session, or that may predate a save, are dropped;
 * - loads are single-flight, so several callers share one request.
 */
export class ProfileController {
  private profile: SkinProfile | null = null;
  private status: ProfileStatus = 'idle';
  private saving = false;
  /** Bumped by `reset()` so results from a previous session are ignored. */
  private session = 0;
  /** Bumped when a save starts and ends so a read that may predate the write is ignored. */
  private writes = 0;
  private loading: Promise<SkinProfile | null> | null = null;

  constructor(
    private readonly api: ProfileApi,
    private readonly onChange: (snapshot: ProfileSnapshot) => void,
  ) {}

  /** Latest profile, readable synchronously (never stale by a render). */
  get current(): SkinProfile | null {
    return this.profile;
  }

  /** Sign-in and sign-out: forget everything, including requests still in flight. */
  reset(): void {
    this.session += 1;
    this.writes += 1;
    this.profile = null;
    this.status = 'idle';
    this.saving = false;
    this.loading = null;
    this.publish();
  }

  /** Loads the saved profile. Never throws: on failure the current value is kept. */
  hydrate(): Promise<SkinProfile | null> {
    if (this.loading) return this.loading;

    const session = this.session;
    const writes = this.writes;
    // A refresh of an already loaded profile does not flip the screens back to "loading".
    if (this.status !== 'ready') {
      this.status = 'loading';
      this.publish();
    }

    const run = (async () => {
      try {
        const loaded = await this.api.get();
        if (session === this.session && writes === this.writes) {
          this.profile = loaded;
          this.status = 'ready';
          this.publish();
        } else if (session === this.session && this.status === 'loading') {
          // A save finished meanwhile: what it stored wins, and it also tells us the profile is known.
          this.status = 'ready';
          this.publish();
        }
      } catch {
        if (session === this.session && this.status === 'loading') {
          this.status = 'failed';
          this.publish();
        }
      } finally {
        if (session === this.session) this.loading = null;
      }
      return this.profile;
    })();

    this.loading = run;
    return run;
  }

  /** The profile once the first load finished; retries a failed load. */
  ensure(): Promise<SkinProfile | null> {
    if (this.status === 'ready') return Promise.resolve(this.profile);
    return this.hydrate();
  }

  /**
   * Saves on the backend first. Resolves with the profile the backend stored, or `null`
   * when another save is running or the session ended meanwhile. Rejects when it failed.
   */
  async save(profile: SkinProfile): Promise<SkinProfile | null> {
    if (this.saving) return null;
    const session = this.session;
    this.saving = true;
    this.writes += 1;
    this.publish();

    try {
      const stored = await this.api.put(profile);
      if (session !== this.session) return null;
      this.profile = stored;
      this.status = 'ready';
      return stored;
    } finally {
      if (session === this.session) {
        this.saving = false;
        this.writes += 1;
        this.publish();
      }
    }
  }

  private publish(): void {
    this.onChange({ profile: this.profile, status: this.status, saving: this.saving });
  }
}
