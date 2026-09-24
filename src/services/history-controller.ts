import type { ScanResult } from '@/types/scan';

/**
 * `idle`: signed out, `loading`: first page is being loaded after sign-in or restore,
 * `ready`: the backend answered (the list may legitimately be empty),
 * `failed`: the first load failed. `failed` is NOT "no history": screens must say so.
 */
export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type HistorySnapshot = {
  /** Newest first, no duplicate ids. */
  scans: ScanResult[];
  status: HistoryStatus;
  refreshing: boolean;
  loadingMore: boolean;
  /** `null` when there is nothing older to load. */
  nextCursor: string | null;
  /** The last refresh or "load more" failed; the list on screen is still valid. */
  loadError: boolean;
  deleting: boolean;
};

export type HistoryApi = {
  list: (options: { cursor: string | null }) => Promise<{ scans: ScanResult[]; nextCursor: string | null }>;
  get: (id: string) => Promise<ScanResult>;
  deleteAll: () => Promise<void>;
};

const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Removes repeated ids, keeping the first (newest) occurrence. */
function uniqueById(scans: ScanResult[]): ScanResult[] {
  const seen = new Set<string>();
  return scans.filter((scan) => {
    if (seen.has(scan.id)) return false;
    seen.add(scan.id);
    return true;
  });
}

/**
 * Keeps the scan history in step with the backend. Free of React so the rules can be
 * tested with a fake API; the provider only renders its snapshots.
 *
 * - the backend is the source of truth: history is loaded after sign-in, page by page;
 * - a failed load is `failed` (or `loadError` once a list exists), never an empty history;
 * - local data is cleared by deletion only after the backend confirmed it, and a failure keeps everything;
 * - answers that belong to an earlier session, or were superseded by a refresh or a deletion, are dropped;
 * - the first load is single-flight, "load more" cannot be started twice, ids never repeat;
 * - a scan made in this session is prepended at once and survives loads that started before it.
 */
export class HistoryController {
  private scans: ScanResult[] = [];
  private status: HistoryStatus = 'idle';
  private refreshing = false;
  private loadingMore = false;
  private nextCursor: string | null = null;
  private loadError = false;
  private deleting = false;

  /** Bumped by `reset()` and by a confirmed deletion: everything in flight then belongs to the past. */
  private session = 0;
  /** Bumped when a first-page load starts, so a slower "load more" or older load cannot land afterwards. */
  private generation = 0;
  private loading: Promise<void> | null = null;
  /** Scans added locally since the running first-page load started (the server page may predate them). */
  private addedSinceLoad: ScanResult[] = [];
  /** Scans opened by id that are older than the loaded pages (deep link, or a page not loaded yet). */
  private details = new Map<string, ScanResult>();
  private detailLoads = new Map<string, Promise<ScanResult>>();

  constructor(
    private readonly api: HistoryApi,
    private readonly onChange: (snapshot: HistorySnapshot) => void,
  ) {}

  /** A scan by id from memory (loaded pages, then opened details); never asks the backend. */
  find(id: string): ScanResult | undefined {
    return this.scans.find((scan) => sameId(scan.id, id)) ?? this.details.get(id.toLowerCase());
  }

  /** Sign-in and sign-out: forget everything, including requests still in flight. */
  reset(): void {
    this.session += 1;
    this.generation += 1;
    this.scans = [];
    this.status = 'idle';
    this.refreshing = false;
    this.loadingMore = false;
    this.nextCursor = null;
    this.loadError = false;
    this.deleting = false;
    this.loading = null;
    this.addedSinceLoad = [];
    this.details.clear();
    this.detailLoads.clear();
    this.publish();
  }

  /** Loads the first page after sign-in or restore, or retries a failed load. Never throws. */
  hydrate(): Promise<void> {
    if (this.loading) return this.loading;
    if (this.deleting) return Promise.resolve();

    const session = this.session;
    const generation = ++this.generation;
    this.status = 'loading';
    this.refreshing = false;
    this.loadingMore = false;
    this.loadError = false;
    this.addedSinceLoad = [];
    this.publish();

    const run = (async () => {
      try {
        const page = await this.api.list({ cursor: null });
        if (this.isCurrent(session, generation)) this.applyFirstPage(page);
      } catch {
        if (this.isCurrent(session, generation)) {
          this.status = 'failed';
          this.publish();
        }
      }
    })();

    this.loading = run;
    // Cleared after the assignment above, even if the API answered synchronously.
    void run.then(() => {
      if (this.loading === run) this.loading = null;
    });
    return run;
  }

  /**
   * Pull-to-refresh and "Retry": reloads the first page. Before the first load has succeeded
   * this is the same as `hydrate()`. A failure keeps the list and sets `loadError`.
   */
  async refresh(): Promise<void> {
    if (this.status === 'idle') return;
    if (this.status !== 'ready') return this.hydrate();
    if (this.refreshing || this.deleting) return;

    const session = this.session;
    const generation = ++this.generation;
    this.refreshing = true;
    // A "load more" that is still running was asked before this refresh: its page is dropped.
    this.loadingMore = false;
    this.loadError = false;
    this.addedSinceLoad = [];
    this.publish();

    try {
      const page = await this.api.list({ cursor: null });
      if (this.isCurrent(session, generation)) this.applyFirstPage(page);
    } catch {
      if (this.isCurrent(session, generation)) this.loadError = true;
    } finally {
      if (this.isCurrent(session, generation)) {
        this.refreshing = false;
        this.publish();
      }
    }
  }

  /** Loads the next older page. Ignored while another load or a deletion is running (double-tap safe). */
  async loadMore(): Promise<void> {
    const cursor = this.nextCursor;
    if (this.status !== 'ready' || !cursor) return;
    if (this.loadingMore || this.refreshing || this.deleting) return;

    const session = this.session;
    const generation = this.generation;
    this.loadingMore = true;
    this.loadError = false;
    this.publish();

    try {
      const page = await this.api.list({ cursor });
      if (!this.isCurrent(session, generation)) return;
      const known = new Set(this.scans.map((scan) => scan.id));
      const older = uniqueById(page.scans).filter((scan) => !known.has(scan.id));
      this.scans = [...this.scans, ...older];
      // A page that adds nothing and points at the same cursor would loop forever: treat it as the end.
      this.nextCursor = older.length === 0 && page.nextCursor === cursor ? null : page.nextCursor;
    } catch {
      if (this.isCurrent(session, generation)) this.loadError = true;
    } finally {
      if (this.isCurrent(session, generation)) {
        this.loadingMore = false;
        this.publish();
      }
    }
  }

  /** A scan just completed in this session: shown first, at once, without a second copy. */
  add(result: ScanResult): void {
    // Signed out (or not started): a scan finishing now belongs to nobody.
    if (this.status === 'idle') return;
    this.scans = [result, ...this.scans.filter((scan) => scan.id !== result.id)];
    this.addedSinceLoad = [result, ...this.addedSinceLoad.filter((scan) => scan.id !== result.id)];
    this.publish();
  }

  /**
   * A scan by id: from memory when possible, otherwise from `GET /scans/:id` (deep link, or a
   * scan beyond the loaded pages). Rejects with the API error (`SCAN_NOT_FOUND`, network, session…).
   */
  loadDetail(id: string): Promise<ScanResult> {
    const known = this.find(id);
    if (known) return Promise.resolve(known);

    const key = id.toLowerCase();
    const pending = this.detailLoads.get(key);
    if (pending) return pending;

    const session = this.session;
    const run = (async () => {
      const scan = await this.api.get(id);
      // Signed out, or the history was deleted, while this was loading: do not resurrect it.
      if (session !== this.session) throw new Error('The history changed while the scan was loading');
      this.details.set(scan.id.toLowerCase(), scan);
      return scan;
    })();

    this.detailLoads.set(key, run);
    const settle = () => {
      if (this.detailLoads.get(key) === run) this.detailLoads.delete(key);
    };
    run.then(settle, settle);
    return run;
  }

  /**
   * Deletes the whole history on the backend, and only after it confirmed (204) clears the
   * local copy. Resolves `true` when deleted, `false` when a deletion is already running (or the
   * session ended meanwhile). Rejects when the backend refused: nothing local changes then.
   */
  async deleteAll(): Promise<boolean> {
    if (this.deleting) return false;

    const session = this.session;
    this.deleting = true;
    this.publish();

    try {
      await this.api.deleteAll();
    } catch (error) {
      if (session === this.session) {
        this.deleting = false;
        this.publish();
      }
      throw error;
    }

    if (session !== this.session) return false;

    // Confirmed. Whatever was loading (older lists, "load more", details) described data that is gone.
    this.session += 1;
    this.generation += 1;
    this.scans = [];
    this.status = 'ready';
    this.refreshing = false;
    this.loadingMore = false;
    this.nextCursor = null;
    this.loadError = false;
    this.deleting = false;
    this.loading = null;
    this.addedSinceLoad = [];
    this.details.clear();
    this.detailLoads.clear();
    this.publish();
    return true;
  }

  private isCurrent(session: number, generation: number): boolean {
    return session === this.session && generation === this.generation;
  }

  /** Replaces the list with the newest page, keeping local-only data the server cannot know yet. */
  private applyFirstPage(page: { scans: ScanResult[]; nextCursor: string | null }): void {
    const local = new Map(this.scans.map((scan) => [scan.id, scan]));
    const fromServer = uniqueById(page.scans).map((scan) => {
      // The photo taken in this session is only known here; the backend never returns it.
      const photoUri = local.get(scan.id)?.photoUri;
      return photoUri ? { ...scan, photoUri } : scan;
    });
    const serverIds = new Set(fromServer.map((scan) => scan.id));
    // Scans finished after this load started may be newer than what the backend answered with.
    const newer = this.addedSinceLoad.filter((scan) => !serverIds.has(scan.id));

    this.scans = [...newer, ...fromServer];
    this.nextCursor = page.nextCursor;
    this.status = 'ready';
    this.loadError = false;
    this.publish();
  }

  private publish(): void {
    this.onChange({
      scans: this.scans,
      status: this.status,
      refreshing: this.refreshing,
      loadingMore: this.loadingMore,
      nextCursor: this.nextCursor,
      loadError: this.loadError,
      deleting: this.deleting,
    });
  }
}
