import type { CareRecommendation } from '@/types/recommendation';

import { apiErrorKind } from './api-error-kind';

/**
 * What a screen can show for the recommendation of one scan.
 * `idle`: nothing asked yet (or the scan is not eligible, e.g. demo data),
 * `loading`: the first request is running,
 * `ready`: the backend answered,
 * `not-found`: the backend has no recommendation for this scan (`RECOMMENDATION_NOT_FOUND`),
 * `error`: the request failed; `kind` tells the user why in words.
 */
export type RecommendationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; recommendation: CareRecommendation }
  | { status: 'not-found' }
  | { status: 'error'; kind: 'network' | 'session' | 'unknown' };

export type RecommendationApi = {
  get: (scanId: string) => Promise<CareRecommendation>;
};

const IDLE: RecommendationState = { status: 'idle' };

/** A rules-only answer this old is asked for again when its screen opens; an LLM one never is. */
export const RULES_CACHE_TTL_MS = 60_000;

type Entry = {
  state: RecommendationState;
  inflight: Promise<void> | null;
  /** When the current `ready` answer arrived. */
  loadedAt: number;
  /** The one background refresh for this answer was already started. */
  refreshed: boolean;
};

const keyOf = (scanId: string) => scanId.toLowerCase();

/**
 * Keeps the care recommendation of each scan in step with the backend. Free of React so the rules
 * can be tested with a fake API; screens read it through `subscribe` / `get`.
 *
 * - one entry per scan id, so an answer can only ever land on the scan it was asked for;
 * - requests are single-flight per scan: many callers, one request;
 * - a failure is `error` / `not-found` (with an explicit `retry`), never an empty recommendation;
 * - a first answer from the rules engine may be refreshed ONCE in the background to pick up the
 *   language-model personalization; a failed refresh keeps the rules answer, and there is no polling;
 * - `reset()` (sign-out) and `forget()` (deleted scans) drop entries and every answer still in flight.
 */
export class RecommendationController {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  /** Bumped by `reset()`: answers that belong to an earlier session are ignored. */
  private session = 0;

  constructor(
    private readonly api: RecommendationApi,
    private readonly now: () => number = Date.now,
  ) {}

  /** Stable between changes (same object until the state actually changes), as `useSyncExternalStore` needs. */
  get = (scanId: string | undefined): RecommendationState => {
    if (!scanId) return IDLE;
    return this.entries.get(keyOf(scanId))?.state ?? IDLE;
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Makes sure the scan's recommendation is loading or loaded. Does nothing for a fresh `ready`
   * answer, and joins a request that is already running. Never throws.
   */
  load(scanId: string): Promise<void> {
    const key = keyOf(scanId);
    const entry = this.entries.get(key);
    if (entry?.inflight) return entry.inflight;
    if (entry?.state.status === 'ready' && !this.isStale(entry)) return Promise.resolve();
    // A stale rules answer stays on screen while it is asked for again.
    return this.request(key, scanId, { quiet: entry?.state.status === 'ready', refresh: false });
  }

  /** The user pressed "Retry": asks again after a failure or a "not found". Never throws. */
  retry(scanId: string): Promise<void> {
    const entry = this.entries.get(keyOf(scanId));
    if (entry?.inflight) return entry.inflight;
    if (entry?.state.status === 'ready') return Promise.resolve();
    return this.request(keyOf(scanId), scanId, { quiet: false, refresh: false });
  }

  /** True while the one background refresh is still allowed for this scan. */
  needsRefresh(scanId: string): boolean {
    const entry = this.entries.get(keyOf(scanId));
    return (
      entry !== undefined &&
      entry.inflight === null &&
      !entry.refreshed &&
      entry.state.status === 'ready' &&
      entry.state.recommendation.source === 'rules'
    );
  }

  /**
   * The single background refresh that may bring in the language-model personalization. It runs
   * at most once per answer, never shows a spinner, and a failure keeps the rules answer.
   */
  refreshOnce(scanId: string): Promise<void> {
    if (!this.needsRefresh(scanId)) return Promise.resolve();
    return this.request(keyOf(scanId), scanId, { quiet: true, refresh: true });
  }

  /** Drops what is known about these scans (they were deleted). */
  forget(scanIds: string[]): void {
    let changed = false;
    for (const scanId of scanIds) changed = this.entries.delete(keyOf(scanId)) || changed;
    if (changed) this.emit();
  }

  /** Sign-in and sign-out: forget everything, including requests still in flight. */
  reset(): void {
    this.session += 1;
    this.entries.clear();
    this.emit();
  }

  private isStale(entry: Entry): boolean {
    return (
      entry.state.status === 'ready' &&
      entry.state.recommendation.source === 'rules' &&
      this.now() - entry.loadedAt > RULES_CACHE_TTL_MS
    );
  }

  private request(key: string, scanId: string, options: { quiet: boolean; refresh: boolean }): Promise<void> {
    const session = this.session;
    const previous = this.entries.get(key);
    const entry: Entry = {
      state: options.quiet && previous ? previous.state : { status: 'loading' },
      inflight: null,
      loadedAt: previous?.loadedAt ?? 0,
      // The refresh is spent as soon as it starts; a new first answer earns a new one.
      refreshed: options.refresh,
    };
    this.entries.set(key, entry);
    if (!options.quiet) this.emit();

    const isCurrent = () => session === this.session && this.entries.get(key) === entry;
    // The request is over the moment its answer is stored. This must happen BEFORE subscribers
    // are told: a screen reacting to the new answer asks `needsRefresh`, which is false while a
    // request is "in flight". (Found on the simulator: the single background refresh never ran.)
    const finish = () => {
      entry.inflight = null;
    };

    const run = (async () => {
      try {
        const recommendation = await this.api.get(scanId);
        if (!isCurrent()) return;
        // A refresh only ever upgrades: its rules answer would change nothing.
        if (options.refresh && recommendation.source !== 'llm' && !recommendation.content.personalization) return;
        entry.state = { status: 'ready', recommendation };
        entry.loadedAt = this.now();
        finish();
        this.emit();
      } catch (error) {
        if (!isCurrent()) return;
        // A quiet request (refresh, or a stale answer being renewed) never takes the answer away.
        if (options.quiet && previous?.state.status === 'ready') {
          entry.state = previous.state;
          return;
        }
        const kind = apiErrorKind(error);
        entry.state =
          kind === 'not-found'
            ? { status: 'not-found' }
            : { status: 'error', kind: kind === 'network' || kind === 'session' ? kind : 'unknown' };
        finish();
        this.emit();
      }
    })();

    entry.inflight = run;
    // Cleared after the assignment above, even if the API answered synchronously.
    void run.then(() => {
      if (entry.inflight === run) entry.inflight = null;
    });
    return run;
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
