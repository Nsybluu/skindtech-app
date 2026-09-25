import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fake, failure, json, noContent, paths, requests } from './support/fake-api.ts';

import { en } from '@/i18n/en';
import { th } from '@/i18n/th';
import { AccountDeletionController, type AccountDeletionSnapshot } from '@/services/account-deletion-controller';
import { accountService } from '@/services/account.service';
import { ApiError } from '@/services/api-error';
import { apiErrorKind } from '@/services/api-error-kind';
import * as auth from '@/services/auth.service';
import { ConsentController } from '@/services/consent-controller';
import { HistoryController, type HistoryApi, type HistorySnapshot } from '@/services/history-controller';
import { ProfileController } from '@/services/profile-controller';
import { scanHistoryService } from '@/services/scan-history.service';
import { scanService } from '@/services/scan.service';
import * as tokens from '@/services/session-token.service';
import type { ScanResult } from '@/types/scan';
import { dataErrorMessage } from '@/utils/data-errors';
import { getDetectedCategories } from '@/utils/format';

const reset = () => {
  requests.length = 0;
};

// ------------------------------------------------------------------ data helpers
/** A scan exactly as `GET /scans` returns it. */
const wire = (n: number, over: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  scannedAt: new Date(Date.UTC(2026, 8, 20, 12, 0, 0) - n * 60_000).toISOString(),
  modelVersion: 'yolov8s-p2-20260918',
  skinProfileSnapshot: { skinType: 'combination', sensitivity: 'sensitive', concerns: ['acne'], ingredientsToAvoid: 'fragrance' },
  image: { width: 416, height: 520 },
  amount: 'mild',
  severity: 'mild',
  detectedTypes: [{ type: 'comedone', confidence: 0.61, count: 2 }],
  detectionAreas: [
    { id: `d-${n}-1`, category: 'comedonal', box: { x: 0.1, y: 0.2, width: 0.05, height: 0.05 } },
    { id: `d-${n}-2`, category: 'comedonal', box: { x: 0.4, y: 0.5, width: 0.05, height: 0.06 } },
  ],
  ...over,
});
/** A parsed scan as the controller holds it. */
const scan = (n: number, over: Partial<ScanResult> = {}): ScanResult => ({ ...(wire(n) as unknown as ScanResult), ...over });
const ids = (list: { id: string }[]) => list.map((s) => s.id);
const listBody = (scans: unknown[], nextCursor: string | null = null) =>
  json(200, { status: 'success', data: { scans, nextCursor } });

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

type Page = { scans: ScanResult[]; nextCursor: string | null };
function makeHistory(api: Partial<HistoryApi> = {}) {
  const snapshots: HistorySnapshot[] = [];
  const full: HistoryApi = {
    list: async () => ({ scans: [], nextCursor: null }),
    get: async () => {
      throw new ApiError(404, 'SCAN_NOT_FOUND');
    },
    deleteSelected: async () => {},
    deleteAll: async () => {},
    ...api,
  };
  const controller = new HistoryController(full, (s) => snapshots.push(s));
  return { controller, snapshots, last: () => snapshots[snapshots.length - 1]! };
}
const page = (numbers: number[], nextCursor: string | null = null): Page => ({ scans: numbers.map((n) => scan(n)), nextCursor });

async function signInFake(): Promise<void> {
  await tokens.storeAuthTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
}

// ================================================================== service: GET /scans
test('listScans: parses a page, never invents a photo, sends limit and an encoded cursor', async () => {
  reset();
  fake.handler = () =>
    listBody(
      [
        // The backend must never hand a photo over; even if one sneaked in it is not copied.
        wire(1, { photoUri: 'https://r2.example/training/1.jpg', imageUrl: 'https://r2.example/x', extra: true }),
        wire(2, { image: undefined, modelVersion: undefined }),
      ],
      'abc+/=def&x',
    );
  const result = await scanHistoryService.listScans({ cursor: 'a+b/c=d&e' });
  assert.equal(requests[0]!.path, '/scans?limit=20&cursor=a%2Bb%2Fc%3Dd%26e');
  assert.equal(requests[0]!.method, 'GET');
  assert.equal(result.nextCursor, 'abc+/=def&x');
  assert.equal(result.scans.length, 2);
  assert.deepEqual(result.scans[0], scan(1));
  assert.equal('photoUri' in result.scans[0]!, false);
  assert.equal('imageUrl' in result.scans[0]!, false);
  assert.equal(result.scans[1]!.image, undefined, 'a scan without image dimensions is fine');
});

test('listScans: no cursor -> no cursor parameter; limit is clamped to 1..50', async () => {
  reset();
  fake.handler = () => listBody([]);
  await scanHistoryService.listScans();
  await scanHistoryService.listScans({ limit: 500 });
  await scanHistoryService.listScans({ limit: 0 });
  assert.deepEqual(paths(), ['/scans?limit=20', '/scans?limit=50', '/scans?limit=1']);
});

test('listScans: an empty history is a real, valid answer', async () => {
  fake.handler = () => listBody([], null);
  assert.deepEqual(await scanHistoryService.listScans(), { scans: [], nextCursor: null });
});

test('listScans: every malformed answer is an INVALID_RESPONSE error, never an empty history', async () => {
  const bad: [string, unknown][] = [
    ['no body data', { status: 'success' }],
    ['data is not an object', { status: 'success', data: 'x' }],
    ['scans missing', { status: 'success', data: { nextCursor: null } }],
    ['scans not an array', { status: 'success', data: { scans: {}, nextCursor: null } }],
    ['nextCursor missing', { status: 'success', data: { scans: [] } }],
    ['nextCursor empty string', { status: 'success', data: { scans: [], nextCursor: '' } }],
    ['nextCursor a number', { status: 'success', data: { scans: [], nextCursor: 5 } }],
    ['scan is null', { status: 'success', data: { scans: [null], nextCursor: null } }],
    ['scan id missing', { status: 'success', data: { scans: [wire(1, { id: undefined })], nextCursor: null } }],
    ['scan id empty', { status: 'success', data: { scans: [wire(1, { id: '' })], nextCursor: null } }],
    ['scannedAt not a date', { status: 'success', data: { scans: [wire(1, { scannedAt: 'yesterday' })], nextCursor: null } }],
    ['scannedAt not a string', { status: 'success', data: { scans: [wire(1, { scannedAt: 12345 })], nextCursor: null } }],
    ['amount outside the enum', { status: 'success', data: { scans: [wire(1, { amount: 'extreme' })], nextCursor: null } }],
    ['severity outside the enum', { status: 'success', data: { scans: [wire(1, { severity: 'critical' })], nextCursor: null } }],
    ['modelVersion wrong type', { status: 'success', data: { scans: [wire(1, { modelVersion: 7 })], nextCursor: null } }],
    ['image dimensions zero', { status: 'success', data: { scans: [wire(1, { image: { width: 0, height: 10 } })], nextCursor: null } }],
    ['image not an object', { status: 'success', data: { scans: [wire(1, { image: 'big' })], nextCursor: null } }],
    ['detectedTypes not an array', { status: 'success', data: { scans: [wire(1, { detectedTypes: 'none' })], nextCursor: null } }],
    ['unknown lesion type', { status: 'success', data: { scans: [wire(1, { detectedTypes: [{ type: 'wart', confidence: 0.5, count: 1 }] })], nextCursor: null } }],
    ['confidence above 1', { status: 'success', data: { scans: [wire(1, { detectedTypes: [{ type: 'papule', confidence: 1.5, count: 1 }] })], nextCursor: null } }],
    ['count fractional', { status: 'success', data: { scans: [wire(1, { detectedTypes: [{ type: 'papule', confidence: 0.5, count: 1.5 }] })], nextCursor: null } }],
    ['detectionAreas missing', { status: 'success', data: { scans: [wire(1, { detectionAreas: undefined })], nextCursor: null } }],
    ['unknown category', { status: 'success', data: { scans: [wire(1, { detectionAreas: [{ id: 'd', category: 'other', box: { x: 0, y: 0, width: 1, height: 1 } }] })], nextCursor: null } }],
    ['box missing', { status: 'success', data: { scans: [wire(1, { detectionAreas: [{ id: 'd', category: 'comedonal' }] })], nextCursor: null } }],
    ['box value not a number', { status: 'success', data: { scans: [wire(1, { detectionAreas: [{ id: 'd', category: 'comedonal', box: { x: '0', y: 0, width: 1, height: 1 } }] })], nextCursor: null } }],
  ];
  for (const [label, body] of bad) {
    fake.handler = () => json(200, body);
    await assert.rejects(scanHistoryService.listScans(), (e: unknown) => e instanceof ApiError && e.code === 'INVALID_RESPONSE', label);
  }
  // one bad scan poisons the whole page: half a history must not pass as a history
  fake.handler = () => listBody([wire(1), wire(2, { severity: 'critical' })]);
  await assert.rejects(scanHistoryService.listScans(), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
});

test('listScans: HTTP failures surface as ApiError (network, server, session)', async () => {
  await signInFake();
  fake.handler = () => failure(500, 'INTERNAL_ERROR');
  await assert.rejects(scanHistoryService.listScans(), (e: unknown) => (e as ApiError).code === 'INTERNAL_ERROR');
  fake.handler = () => {
    throw new TypeError('Network request failed');
  };
  await assert.rejects(scanHistoryService.listScans(), (e: unknown) => (e as ApiError).code === 'NETWORK_ERROR');
});

// ================================================================== service: GET /scans/:id, DELETE /scans
test('getScan: the id is URL-encoded, the answer parsed, and a different scan is rejected', async () => {
  reset();
  fake.handler = () => json(200, { status: 'success', data: { scan: wire(1) } });
  const id = wire(1).id;
  assert.deepEqual(await scanHistoryService.getScan(id), scan(1));
  assert.equal(requests[0]!.path, `/scans/${id}`);

  reset();
  await scanHistoryService.getScan(id.toUpperCase()).catch(() => undefined);
  fake.handler = () => json(200, { status: 'success', data: { scan: wire(1) } });
  assert.ok(await scanHistoryService.getScan(id.toUpperCase()), 'ids compare case-insensitively');

  reset();
  fake.handler = () => json(200, { status: 'success', data: { scan: wire(1) } });
  await scanHistoryService.getScan('a/b?c#d e').catch(() => undefined);
  assert.equal(requests[0]!.path, '/scans/a%2Fb%3Fc%23d%20e', 'an id can never change the path or query');

  fake.handler = () => json(200, { status: 'success', data: { scan: wire(2) } });
  await assert.rejects(scanHistoryService.getScan(id), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE', 'answer about another scan');
  fake.handler = () => json(200, { status: 'success', data: {} });
  await assert.rejects(scanHistoryService.getScan(id), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
});

test('getScan: SCAN_NOT_FOUND is a 404 ApiError with that code', async () => {
  await signInFake();
  fake.handler = () => failure(404, 'SCAN_NOT_FOUND');
  await assert.rejects(scanHistoryService.getScan('x'), (e: unknown) => e instanceof ApiError && e.statusCode === 404 && e.code === 'SCAN_NOT_FOUND');
});

test('deleteHistory: really calls DELETE /scans (no mock) and only 204 is success', async () => {
  await signInFake();
  reset();
  fake.handler = () => noContent();
  assert.equal(await scanHistoryService.deleteHistory(), undefined);
  assert.deepEqual(requests.map((r) => `${r.method} ${r.path}`), ['DELETE /scans']);
  assert.equal(requests[0]!.headers.get('authorization'), 'Bearer access-1');

  fake.handler = () => failure(503, 'STORAGE_UNAVAILABLE');
  await assert.rejects(scanHistoryService.deleteHistory(), (e: unknown) => apiErrorKind(e) === 'storage');
});

test('scan.service no longer has a mock deleteHistory', () => {
  assert.equal('deleteHistory' in scanService, false);
});

// ================================================================== auth session no longer carries history
test('login/register/restore sessions carry only the user (history comes from the backend)', async () => {
  fake.handler = (url) =>
    url.endsWith('/auth/me')
      ? json(200, { status: 'success', data: { user: { id: 'u', email: 'a@b.c', displayName: 'A' } } })
      : json(200, {
          status: 'success',
          data: { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 900, user: { id: 'u', email: 'a@b.c', displayName: 'A' } },
        });
  const session = await auth.authService.signInWithEmail('a@b.c', 'password1');
  assert.deepEqual(Object.keys(session), ['user']);
  assert.deepEqual((await auth.authService.signUpWithEmail('a@b.c', 'password1')) && Object.keys(await auth.authService.signInWithGoogle('t')), ['user']);
  assert.deepEqual(Object.keys((await auth.authService.restoreSession())!), ['user']);
});

// ================================================================== apiRequest: 401 handling
test('apiRequest: 401 INVALID_CREDENTIALS is thrown as is — no refresh, no retry, tokens untouched', async () => {
  await signInFake();
  reset();
  fake.handler = () => failure(401, 'INVALID_CREDENTIALS');
  await assert.rejects(accountService.deleteAccount('wrong-password'), (e: unknown) => (e as ApiError).code === 'INVALID_CREDENTIALS');
  assert.deepEqual(paths(), ['/account'], 'one request: the session was never "refreshed"');
  assert.equal(tokens.getAccessToken(), 'access-1');
  assert.equal(await tokens.getStoredRefreshToken(), 'refresh-1');
});

test('apiRequest: an expired access token (401 UNAUTHORIZED) is still refreshed once and retried', async () => {
  await signInFake();
  reset();
  fake.handler = (url, init) => {
    if (url.endsWith('/auth/refresh')) return json(200, { status: 'success', data: { accessToken: 'access-2', refreshToken: 'refresh-2' } });
    return new Headers(init.headers).get('authorization') === 'Bearer access-1'
      ? failure(401, 'UNAUTHORIZED')
      : listBody([wire(1)]);
  };
  const result = await scanHistoryService.listScans();
  assert.equal(result.scans.length, 1);
  assert.deepEqual(paths(), ['/scans?limit=20', '/auth/refresh', '/scans?limit=20']);
  assert.equal(tokens.getAccessToken(), 'access-2');
});

// ================================================================== controller: hydrate
test('hydrate: loading -> ready with the first page and its cursor; sign-in is not held up', async () => {
  const gate = deferred<Page>();
  const { controller, snapshots, last } = makeHistory({ list: () => gate.promise });
  const loading = controller.hydrate();
  assert.equal(last().status, 'loading', 'synchronously loading: the caller (sign-in) is not blocked');
  assert.deepEqual(last().scans, [], 'nothing is invented while loading');
  gate.resolve(page([1, 2, 3], 'next-1'));
  await loading;
  assert.equal(last().status, 'ready');
  assert.deepEqual(ids(last().scans), [1, 2, 3].map((n) => wire(n).id));
  assert.equal(last().nextCursor, 'next-1');
  assert.deepEqual(snapshots.map((s) => s.status), ['idle'].slice(1).concat(['loading', 'ready']));
});

test('hydrate: an empty history is "ready" and empty', async () => {
  const { controller, last } = makeHistory({ list: async () => page([]) });
  await controller.hydrate();
  assert.equal(last().status, 'ready');
  assert.deepEqual(last().scans, []);
  assert.equal(last().nextCursor, null);
});

test('hydrate: a failed load is "failed" — never mistaken for an empty history — and refresh retries it', async () => {
  let fail = true;
  let calls = 0;
  const { controller, last } = makeHistory({
    list: async () => {
      calls += 1;
      if (fail) throw new ApiError(0, 'NETWORK_ERROR');
      return page([1]);
    },
  });
  await controller.hydrate();
  assert.equal(last().status, 'failed');
  assert.notEqual(last().status, 'ready');
  fail = false;
  await controller.refresh();
  assert.equal(last().status, 'ready');
  assert.deepEqual(ids(last().scans), [wire(1).id]);
  assert.equal(calls, 2);
});

test('hydrate: a malformed answer from the service counts as failed, not as empty', async () => {
  await signInFake();
  fake.handler = () => json(200, { status: 'success', data: { scans: 'nope', nextCursor: null } });
  const { controller, last } = makeHistory({ list: ({ cursor }) => scanHistoryService.listScans({ cursor }) });
  await controller.hydrate();
  assert.equal(last().status, 'failed');
});

test('hydrate: single-flight — three callers share one request', async () => {
  let calls = 0;
  const gate = deferred<Page>();
  const { controller } = makeHistory({ list: () => { calls += 1; return gate.promise; } });
  const a = controller.hydrate();
  const b = controller.hydrate();
  const c = controller.refresh();
  gate.resolve(page([1]));
  await Promise.all([a, b, c]);
  assert.equal(calls, 1);
});

test('stale session: an answer for the previous account never reaches the new one', async () => {
  const oldGate = deferred<Page>();
  const newGate = deferred<Page>();
  let call = 0;
  const { controller, last } = makeHistory({ list: () => (++call === 1 ? oldGate.promise : newGate.promise) });

  const first = controller.hydrate();          // account A signs in
  controller.reset();                          // ... and out again (or the session dies)
  const second = controller.hydrate();         // account B signs in
  newGate.resolve(page([10, 11]));
  await second;
  assert.deepEqual(ids(last().scans), [10, 11].map((n) => wire(n).id));

  oldGate.resolve(page([1, 2, 3]));            // A's slow answer finally arrives
  await first;
  assert.deepEqual(ids(last().scans), [10, 11].map((n) => wire(n).id), 'A\'s scans did not overwrite B\'s');
  assert.equal(last().status, 'ready');
});

test('logout clears the history and a late answer cannot bring it back', async () => {
  const gate = deferred<Page>();
  const { controller, last } = makeHistory({ list: () => gate.promise });
  const loading = controller.hydrate();
  controller.reset();
  assert.equal(last().status, 'idle');
  gate.resolve(page([1, 2]));
  await loading;
  assert.deepEqual(last().scans, []);
  assert.equal(last().status, 'idle');
  // and a scan finishing after sign-out belongs to nobody
  controller.add(scan(9));
  assert.deepEqual(last().scans, []);
});

// ================================================================== controller: cursor pagination
test('loadMore: passes the cursor, appends older scans, and stops at the end', async () => {
  const cursors: (string | null)[] = [];
  const pages: Record<string, Page> = {
    start: page([1, 2], 'c1'),
    c1: page([3, 4], 'c2'),
    c2: page([5], null),
  };
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => {
      cursors.push(cursor);
      return pages[cursor ?? 'start']!;
    },
  });
  await controller.hydrate();
  await controller.loadMore();
  assert.deepEqual(ids(last().scans), [1, 2, 3, 4].map((n) => wire(n).id));
  assert.equal(last().nextCursor, 'c2');
  await controller.loadMore();
  assert.deepEqual(ids(last().scans), [1, 2, 3, 4, 5].map((n) => wire(n).id));
  assert.equal(last().nextCursor, null);
  await controller.loadMore();      // nothing older: ignored
  assert.deepEqual(cursors, [null, 'c1', 'c2']);
});

test('loadMore: a double tap asks for the page once, and the button state is loadingMore meanwhile', async () => {
  let calls = 0;
  const gate = deferred<Page>();
  const { controller, last } = makeHistory({
    list: ({ cursor }) => {
      if (!cursor) return Promise.resolve(page([1], 'c1'));
      calls += 1;
      return gate.promise;
    },
  });
  await controller.hydrate();
  const a = controller.loadMore();
  const b = controller.loadMore();
  assert.equal(last().loadingMore, true);
  gate.resolve(page([2], null));
  await Promise.all([a, b]);
  assert.equal(calls, 1);
  assert.equal(last().loadingMore, false);
  assert.deepEqual(ids(last().scans), [1, 2].map((n) => wire(n).id));
});

test('loadMore: repeated ids (across pages and inside one page) are merged out', async () => {
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => (cursor ? { scans: [scan(2), scan(3), scan(3), scan(1)], nextCursor: null } : page([1, 2], 'c1')),
  });
  await controller.hydrate();
  await controller.loadMore();
  assert.deepEqual(ids(last().scans), [1, 2, 3].map((n) => wire(n).id));
});

test('loadMore: a page that adds nothing and repeats the cursor ends the list (no endless loop)', async () => {
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => (cursor ? page([1], 'c1') : page([1], 'c1')),
  });
  await controller.hydrate();
  await controller.loadMore();
  assert.equal(last().nextCursor, null);
});

test('loadMore: a failure keeps the list and the cursor, flags loadError, and can be retried', async () => {
  let fail = true;
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => {
      if (!cursor) return page([1, 2], 'c1');
      if (fail) throw new ApiError(0, 'NETWORK_ERROR');
      return page([3], null);
    },
  });
  await controller.hydrate();
  await controller.loadMore();
  assert.equal(last().loadError, true);
  assert.equal(last().loadingMore, false);
  assert.equal(last().status, 'ready');
  assert.deepEqual(ids(last().scans), [1, 2].map((n) => wire(n).id));
  assert.equal(last().nextCursor, 'c1');
  fail = false;
  await controller.loadMore();
  assert.equal(last().loadError, false);
  assert.deepEqual(ids(last().scans), [1, 2, 3].map((n) => wire(n).id));
});

test('loadMore that started before a refresh is dropped when it lands afterwards', async () => {
  const moreGate = deferred<Page>();
  let phase: 'first' | 'more' | 'refresh' = 'first';
  const { controller, last } = makeHistory({
    list: ({ cursor }) => {
      if (phase === 'first') return Promise.resolve(page([1, 2], 'c1'));
      if (cursor) return moreGate.promise;
      return Promise.resolve(page([9, 1, 2], 'c9'));
    },
  });
  await controller.hydrate();
  phase = 'more';
  const more = controller.loadMore();
  phase = 'refresh';
  await controller.refresh();
  assert.deepEqual(ids(last().scans), [9, 1, 2].map((n) => wire(n).id));
  moreGate.resolve(page([3, 4], null));
  await more;
  assert.deepEqual(ids(last().scans), [9, 1, 2].map((n) => wire(n).id), 'the old page did not land on the new list');
  assert.equal(last().nextCursor, 'c9');
  assert.equal(last().loadingMore, false);
});

// ================================================================== controller: refresh
test('refresh: replaces the list, resets the cursor, never flips back to "loading"', async () => {
  let n = 0;
  const { controller, snapshots, last } = makeHistory({
    list: async () => (++n === 1 ? page([1, 2], 'c1') : page([5, 1], 'c5')),
  });
  await controller.hydrate();
  const before = snapshots.length;
  const refreshing = controller.refresh();
  assert.equal(last().refreshing, true);
  await refreshing;
  assert.deepEqual(ids(last().scans), [5, 1].map((x) => wire(x).id));
  assert.equal(last().nextCursor, 'c5');
  assert.equal(last().refreshing, false);
  assert.ok(snapshots.slice(before).every((s) => s.status === 'ready'));
});

test('refresh: a failure keeps the list on screen and flags loadError', async () => {
  let n = 0;
  const { controller, last } = makeHistory({
    list: async () => {
      if (++n === 1) return page([1, 2], null);
      throw new ApiError(500, 'INTERNAL_ERROR');
    },
  });
  await controller.hydrate();
  await controller.refresh();
  assert.equal(last().status, 'ready');
  assert.equal(last().loadError, true);
  assert.equal(last().refreshing, false);
  assert.deepEqual(ids(last().scans), [1, 2].map((x) => wire(x).id));
});

test('refresh: the photo taken in this session is kept for the same scan id', async () => {
  const { controller, last } = makeHistory({ list: async () => page([1, 2]) });
  await controller.hydrate();
  controller.add(scan(1, { photoUri: 'file:///photo-1.jpg' }));
  await controller.refresh();
  assert.equal(last().scans.find((s) => s.id === wire(1).id)!.photoUri, 'file:///photo-1.jpg');
  assert.equal(last().scans.find((s) => s.id === wire(2).id)!.photoUri, undefined, 'others never get one');
});

// ================================================================== controller: a new scan
test('add: a new scan is prepended once, with its photo, without duplicates', async () => {
  const { controller, last } = makeHistory({ list: async () => page([2, 3]) });
  await controller.hydrate();
  controller.add(scan(1, { photoUri: 'file:///p.jpg' }));
  assert.deepEqual(ids(last().scans), [1, 2, 3].map((n) => wire(n).id));
  controller.add(scan(1, { photoUri: 'file:///p.jpg' }));
  assert.equal(last().scans.length, 3, 'the same scan is not added twice');
});

test('add: a scan finished while the first load is running survives that load, even if it predates it', async () => {
  const gate = deferred<Page>();
  const { controller, last } = makeHistory({ list: () => gate.promise });
  const loading = controller.hydrate();
  controller.add(scan(0, { photoUri: 'file:///new.jpg' }));     // scanned right after login
  gate.resolve(page([1, 2]));                                      // the server page was read before it
  await loading;
  assert.deepEqual(ids(last().scans), [0, 1, 2].map((n) => wire(n).id));
  assert.equal(last().scans[0]!.photoUri, 'file:///new.jpg');
});

test('add: when the server page already contains the new scan there is still just one', async () => {
  const gate = deferred<Page>();
  const { controller, last } = makeHistory({ list: () => gate.promise });
  const loading = controller.hydrate();
  controller.add(scan(0, { photoUri: 'file:///new.jpg' }));
  gate.resolve(page([0, 1]));
  await loading;
  assert.deepEqual(ids(last().scans), [0, 1].map((n) => wire(n).id));
  assert.equal(last().scans[0]!.photoUri, 'file:///new.jpg', 'the local photo is not lost');
});

test('add: after a failed first load the new scan is shown and the failure is still reported', async () => {
  const { controller, last } = makeHistory({
    list: async () => {
      throw new ApiError(0, 'NETWORK_ERROR');
    },
  });
  await controller.hydrate();
  controller.add(scan(1));
  assert.equal(last().status, 'failed');
  assert.deepEqual(ids(last().scans), [wire(1).id]);
});

// ================================================================== controller: detail by id
test('loadDetail: memory first (no request), otherwise GET /scans/:id once, then remembered', async () => {
  const gets: string[] = [];
  const gate = deferred<ScanResult>();
  const { controller } = makeHistory({
    list: async () => page([1, 2]),
    get: (id) => {
      gets.push(id);
      return gate.promise;
    },
  });
  await controller.hydrate();
  assert.equal((await controller.loadDetail(wire(1).id)).id, wire(1).id);
  assert.deepEqual(gets, [], 'a scan in memory needs no request');

  const a = controller.loadDetail(wire(7).id);
  const b = controller.loadDetail(wire(7).id);
  gate.resolve(scan(7));
  assert.equal((await a).id, wire(7).id);
  assert.equal((await b).id, wire(7).id);
  assert.deepEqual(gets, [wire(7).id], 'single-flight');
  assert.equal(controller.find(wire(7).id.toUpperCase())?.id, wire(7).id, 'found later, case-insensitively');
  await controller.loadDetail(wire(7).id);
  assert.equal(gets.length, 1);
});

test('loadDetail: SCAN_NOT_FOUND and network errors reject with the ApiError and are not cached', async () => {
  let code: [number, string] = [404, 'SCAN_NOT_FOUND'];
  const { controller } = makeHistory({
    get: async () => {
      throw new ApiError(code[0], code[1]);
    },
  });
  await assert.rejects(controller.loadDetail('nope'), (e: unknown) => apiErrorKind(e) === 'not-found');
  code = [0, 'NETWORK_ERROR'];
  await assert.rejects(controller.loadDetail('nope'), (e: unknown) => apiErrorKind(e) === 'network');
  code = [401, 'UNAUTHORIZED'];
  await assert.rejects(controller.loadDetail('nope'), (e: unknown) => apiErrorKind(e) === 'session');
  assert.equal(controller.find('nope'), undefined);
});

test('loadDetail: a detail that lands after sign-out is dropped and not remembered', async () => {
  const gate = deferred<ScanResult>();
  const { controller } = makeHistory({ get: () => gate.promise });
  const pending = controller.loadDetail(wire(5).id);
  controller.reset();
  gate.resolve(scan(5));
  await assert.rejects(pending);
  assert.equal(controller.find(wire(5).id), undefined);
});

// ================================================================== controller: delete history
test('deleteAll: nothing changes locally until the backend confirmed; then history is empty', async () => {
  const gate = deferred<void>();
  const { controller, last } = makeHistory({ list: async () => page([1, 2], 'c1'), deleteAll: () => gate.promise });
  await controller.hydrate();
  const deleting = controller.deleteAll();
  assert.equal(last().deleting, true);
  assert.equal(last().scans.length, 2, 'still shown while the request is running');
  gate.resolve();
  assert.equal(await deleting, true);
  assert.deepEqual(last().scans, []);
  assert.equal(last().status, 'ready', 'an empty but known history');
  assert.equal(last().nextCursor, null);
  assert.equal(last().deleting, false);
  assert.equal(controller.find(wire(1).id), undefined);
});

test('deleteAll: a failure (STORAGE_UNAVAILABLE / network) keeps every scan and rethrows', async () => {
  let error: ApiError = new ApiError(503, 'STORAGE_UNAVAILABLE');
  const { controller, last } = makeHistory({
    list: async () => page([1, 2], 'c1'),
    deleteAll: async () => {
      throw error;
    },
  });
  await controller.hydrate();
  await assert.rejects(controller.deleteAll(), (e: unknown) => apiErrorKind(e) === 'storage');
  assert.deepEqual(ids(last().scans), [1, 2].map((n) => wire(n).id));
  assert.equal(last().nextCursor, 'c1');
  assert.equal(last().deleting, false, 'the button is usable again');
  error = new ApiError(0, 'NETWORK_ERROR');
  await assert.rejects(controller.deleteAll(), (e: unknown) => apiErrorKind(e) === 'network');
  assert.equal(last().scans.length, 2);
  assert.equal(dataErrorMessage(new ApiError(503, 'STORAGE_UNAVAILABLE'), en), en.dataErrors.storageUnavailable);
  assert.equal(dataErrorMessage(new ApiError(503, 'STORAGE_UNAVAILABLE'), th), th.dataErrors.storageUnavailable);
});

test('deleteAll: a double press sends one request; loads are blocked while it runs', async () => {
  let deletes = 0;
  let lists = 0;
  const gate = deferred<void>();
  const { controller, last } = makeHistory({
    list: async () => {
      lists += 1;
      return page([1, 2], 'c1');
    },
    deleteAll: () => {
      deletes += 1;
      return gate.promise;
    },
  });
  await controller.hydrate();
  const first = controller.deleteAll();
  assert.equal(await controller.deleteAll(), false, 'the second press is ignored');
  await controller.refresh();
  await controller.loadMore();
  assert.equal(lists, 1, 'no refresh / load more while deleting');
  gate.resolve();
  assert.equal(await first, true);
  assert.equal(deletes, 1);
  assert.equal(last().scans.length, 0);
});

test('deleteAll: a load that was running before the deletion cannot bring the history back', async () => {
  const gate = deferred<Page>();
  let n = 0;
  const { controller, last } = makeHistory({ list: () => (++n === 1 ? Promise.resolve(page([1])) : gate.promise) });
  await controller.hydrate();
  const refreshing = controller.refresh();
  await controller.deleteAll();
  gate.resolve(page([1, 2, 3]));
  await refreshing;
  assert.deepEqual(last().scans, []);
  assert.equal(last().refreshing, false);
  assert.equal(last().status, 'ready');
});

test('deleteAll: signing out while it runs leaves the controller reset', async () => {
  const gate = deferred<void>();
  const { controller, last } = makeHistory({ list: async () => page([1]), deleteAll: () => gate.promise });
  await controller.hydrate();
  const deleting = controller.deleteAll();
  controller.reset();
  gate.resolve();
  assert.equal(await deleting, false);
  assert.equal(last().status, 'idle');
});

// ================================================================== service: DELETE /scans/selection
test('deleteScans: DELETE /scans/selection with the distinct ids, authenticated; 204 is success', async () => {
  await signInFake();
  reset();
  fake.handler = () => noContent();
  assert.equal(await scanHistoryService.deleteScans([wire(1).id, wire(2).id, wire(1).id]), undefined);
  assert.deepEqual(requests.map((r) => `${r.method} ${r.path}`), ['DELETE /scans/selection']);
  assert.deepEqual(requests[0]!.body, { ids: [wire(1).id, wire(2).id] });
  assert.equal(requests[0]!.headers.get('authorization'), 'Bearer access-1');
  assert.equal(requests[0]!.headers.get('content-type'), 'application/json');
});

test('deleteScans: nothing or too many ids is refused without sending a request', async () => {
  reset();
  await assert.rejects(scanHistoryService.deleteScans([]), (e: unknown) => (e as ApiError).code === 'VALIDATION_ERROR');
  const fiftyOne = Array.from({ length: 51 }, (_, n) => wire(n + 1).id);
  await assert.rejects(scanHistoryService.deleteScans(fiftyOne), (e: unknown) => (e as ApiError).code === 'VALIDATION_ERROR');
  assert.equal(requests.length, 0);
  fake.handler = () => noContent();
  await scanHistoryService.deleteScans(fiftyOne.slice(0, 50));   // exactly 50 is fine
  assert.equal(requests.length, 1);
});

test('deleteScans: SCAN_NOT_FOUND, STORAGE_UNAVAILABLE, network and session failures are classified', async () => {
  await signInFake();
  for (const [respond, kind] of [
    [() => failure(404, 'SCAN_NOT_FOUND'), 'not-found'],
    [() => failure(503, 'STORAGE_UNAVAILABLE'), 'storage'],
    [() => failure(400, 'VALIDATION_ERROR'), 'unknown'],
    [() => { throw new TypeError('offline'); }, 'network'],
  ] as const) {
    fake.handler = respond;
    await assert.rejects(scanHistoryService.deleteScans([wire(1).id]), (e: unknown) => apiErrorKind(e) === kind, kind);
  }
});

// ================================================================== controller: Manage mode / selection
const pageOf = (count: number, nextCursor: string | null = null): Page => page(Array.from({ length: count }, (_, n) => n + 1), nextCursor);
const wid = (n: number) => wire(n).id;

test('selection: Manage mode needs a loaded, non-empty history; picking, unpicking and leaving work', async () => {
  const { controller, snapshots, last } = makeHistory({ list: async () => pageOf(3) });
  controller.beginSelection();
  assert.equal(snapshots.length, 0, 'not before the history is loaded: nothing changes, nothing is published');
  await controller.hydrate();
  controller.beginSelection();
  assert.equal(last().selecting, true);
  assert.deepEqual(last().selectedIds, []);
  assert.equal(controller.toggleSelected(wid(1)), true);
  assert.equal(controller.toggleSelected(wid(3)), true);
  assert.deepEqual(last().selectedIds, [wid(1), wid(3)]);
  assert.equal(controller.toggleSelected(wid(1)), true);
  assert.deepEqual(last().selectedIds, [wid(3)]);
  assert.equal(controller.toggleSelected('not-loaded'), false, 'only loaded scans can be picked');
  controller.endSelection();
  assert.equal(last().selecting, false);
  assert.deepEqual(last().selectedIds, [], 'leaving Manage mode always clears the selection');
  assert.equal(controller.toggleSelected(wid(1)), false, 'no picking outside Manage mode');

  const empty = makeHistory({ list: async () => pageOf(0) });
  await empty.controller.hydrate();
  empty.controller.beginSelection();
  assert.equal(empty.last().selecting, false, 'nothing to manage in an empty history');
});

test('selection: at most 50 scans can be picked one by one', async () => {
  const { controller, last } = makeHistory({ list: async () => pageOf(60) });
  await controller.hydrate();
  controller.beginSelection();
  for (let n = 1; n <= 50; n += 1) assert.equal(controller.toggleSelected(wid(n)), true);
  assert.equal(controller.toggleSelected(wid(51)), false);
  assert.equal(last().selectedIds.length, 50);
  assert.equal(controller.toggleSelected(wid(50)), true, 'unpicking still works at the limit');
  assert.equal(controller.toggleSelected(wid(51)), true);
});

test('selection: "Select all" means the whole account history (also unloaded pages) and locks single cards', async () => {
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => (cursor ? page([4, 5], null) : page([1, 2, 3], 'c1')),
  });
  await controller.hydrate();
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  controller.selectAll();
  assert.equal(last().allSelected, true);
  assert.deepEqual(last().selectedIds, [], 'the earlier single pick is folded into "all"');
  assert.equal(last().nextCursor, 'c1', 'unloaded pages exist, and are part of "all"');
  assert.equal(controller.toggleSelected(wid(2)), false, 'cards are locked while everything is selected');
  await controller.loadMore();
  assert.equal(last().allSelected, true, 'newly loaded scans are selected too');
  controller.clearSelection();
  assert.equal(last().allSelected, false);
  assert.equal(last().selecting, true, 'still in Manage mode');
  assert.equal(controller.toggleSelected(wid(2)), true);
  controller.selectAll();
  controller.endSelection();
  assert.equal(last().allSelected, false);
});

test('selection: logout, a refresh that drops a scan, and a finished deletion all clean the selection', async () => {
  let n = 0;
  const { controller, last } = makeHistory({ list: async () => (++n === 1 ? pageOf(3) : page([1, 3])) });
  await controller.hydrate();
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  controller.toggleSelected(wid(2));
  await controller.refresh();                    // scan 2 was deleted on another device
  assert.deepEqual(last().selectedIds, [wid(1)], 'a picked scan that no longer exists is unpicked');
  assert.equal(last().selecting, true);

  controller.selectAll();
  controller.reset();                            // logout / account switch
  assert.equal(last().selecting, false);
  assert.equal(last().allSelected, false);
  assert.deepEqual(last().selectedIds, []);

  const b = makeHistory({ list: async () => pageOf(2) });
  await b.controller.hydrate();
  b.controller.beginSelection();
  b.controller.selectAll();
  assert.equal(await b.controller.deleteAll(), true);
  assert.equal(b.last().selecting, false, 'deleting everything ends Manage mode');
  assert.equal(b.last().allSelected, false);
});

// ================================================================== controller: delete selected
test('deleteSelected: not optimistic — the scans stay until the backend confirmed, then they and the selection go', async () => {
  const gate = deferred<void>();
  const sent: string[][] = [];
  const { controller, last } = makeHistory({
    list: async () => pageOf(4),
    deleteSelected: (ids) => { sent.push(ids); return gate.promise; },
  });
  await controller.hydrate();
  await controller.loadDetail(wid(2));               // memory hit, but make sure caches are cleaned too
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  controller.toggleSelected(wid(3));
  const deleting = controller.deleteSelected([wid(1), wid(3)]);
  assert.equal(last().deleting, true);
  assert.deepEqual(ids(last().scans), [1, 2, 3, 4].map(wid), 'nothing removed while the request runs');
  assert.deepEqual(last().selectedIds, [wid(1), wid(3)]);
  gate.resolve();
  assert.equal(await deleting, true);
  assert.deepEqual(sent, [[wid(1), wid(3)]]);
  assert.deepEqual(ids(last().scans), [2, 4].map(wid));
  assert.equal(last().deleting, false);
  assert.equal(last().selecting, false, 'Manage mode ends');
  assert.deepEqual(last().selectedIds, []);
  assert.equal(controller.find(wid(1)), undefined);
  assert.equal(controller.find(wid(2))?.id, wid(2), 'unselected scans stay');
  assert.equal(last().status, 'ready');
});

test('deleteSelected: deleting the newest scan makes the next one the "latest result"', async () => {
  const { controller, last } = makeHistory({ list: async () => pageOf(3) });
  await controller.hydrate();
  assert.equal(last().scans[0]!.id, wid(1));
  await controller.deleteSelected([wid(1)]);
  assert.equal(last().scans[0]!.id, wid(2));
  await controller.deleteSelected([wid(2), wid(3)]);
  assert.deepEqual(last().scans, []);
  assert.equal(last().status, 'ready');
  assert.equal(last().nextCursor, null, 'truly empty: nothing older either');
});

test('deleteSelected: a failure keeps every scan, the selection and Manage mode, and rethrows', async () => {
  let error: ApiError = new ApiError(503, 'STORAGE_UNAVAILABLE');
  const { controller, last } = makeHistory({
    list: async () => pageOf(3),
    deleteSelected: async () => { throw error; },
  });
  await controller.hydrate();
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  controller.toggleSelected(wid(2));
  await assert.rejects(controller.deleteSelected([wid(1), wid(2)]), (e: unknown) => apiErrorKind(e) === 'storage');
  assert.deepEqual(ids(last().scans), [1, 2, 3].map(wid));
  assert.deepEqual(last().selectedIds, [wid(1), wid(2)]);
  assert.equal(last().selecting, true);
  assert.equal(last().deleting, false, 'the button is usable again');
  error = new ApiError(0, 'NETWORK_ERROR');
  await assert.rejects(controller.deleteSelected([wid(1), wid(2)]), (e: unknown) => apiErrorKind(e) === 'network');
  assert.equal(last().scans.length, 3);
  assert.equal(last().selecting, true);
});

test('deleteSelected: SCAN_NOT_FOUND (deleted elsewhere) keeps the selection request failed, then resyncs the list', async () => {
  let n = 0;
  const { controller, last } = makeHistory({
    list: async () => (++n === 1 ? pageOf(3) : page([1, 3])),
    deleteSelected: async () => { throw new ApiError(404, 'SCAN_NOT_FOUND'); },
  });
  await controller.hydrate();
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  controller.toggleSelected(wid(2));
  await assert.rejects(controller.deleteSelected([wid(1), wid(2)]), (e: unknown) => apiErrorKind(e) === 'not-found');
  await tick();
  await tick();
  assert.deepEqual(ids(last().scans), [1, 3].map(wid), 'the list was refreshed');
  assert.deepEqual(last().selectedIds, [wid(1)], 'the vanished scan is no longer picked');
  assert.equal(last().selecting, true);
});

test('deleteSelected: a double press sends one request; picking is frozen meanwhile; bad input is ignored', async () => {
  let calls = 0;
  const gate = deferred<void>();
  const { controller, last } = makeHistory({
    list: async () => pageOf(3),
    deleteSelected: () => { calls += 1; return gate.promise; },
  });
  await controller.hydrate();
  assert.equal(await controller.deleteSelected([]), false);
  assert.equal(await controller.deleteSelected(Array.from({ length: 51 }, (_, n) => `x${n}`)), false);
  assert.equal(calls, 0);
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  const first = controller.deleteSelected([wid(1)]);
  assert.equal(await controller.deleteSelected([wid(1)]), false, 'the second press is ignored');
  assert.equal(await controller.deleteAll(), false, 'and so is delete-all while one deletion runs');
  assert.equal(controller.toggleSelected(wid(2)), false);
  controller.selectAll();
  controller.clearSelection();
  controller.endSelection();
  assert.equal(last().selecting, true, 'Manage mode cannot be left mid-request');
  assert.deepEqual(last().selectedIds, [wid(1)]);
  gate.resolve();
  assert.equal(await first, true);
  assert.equal(calls, 1);
});

test('deleteSelected: pages that were loading before the deletion cannot bring the scans back', async () => {
  const refreshGate = deferred<Page>();
  const moreGate = deferred<Page>();
  let phase: 'first' | 'refresh' | 'more' = 'first';
  const { controller, last } = makeHistory({
    list: ({ cursor }) => {
      if (phase === 'first') return Promise.resolve(pageOf(3, 'c1'));
      return cursor ? moreGate.promise : refreshGate.promise;
    },
  });
  await controller.hydrate();

  phase = 'more';
  const more = controller.loadMore();
  await controller.deleteSelected([wid(1)]);
  moreGate.resolve(page([1, 4], null));              // stale page still lists the deleted scan
  await more;
  assert.deepEqual(ids(last().scans), [2, 3].map(wid), 'the stale "load more" page was dropped');
  assert.equal(last().loadingMore, false);

  phase = 'refresh';
  const refreshing = controller.refresh();
  await controller.deleteSelected([wid(2)]);
  refreshGate.resolve(page([1, 2, 3], 'c9'));
  await refreshing;
  assert.deepEqual(ids(last().scans), [wid(3)], 'the stale refresh was dropped too');
  assert.equal(last().refreshing, false);
});

test('deleteSelected: a detail that was loading for a deleted scan is dropped, and not remembered', async () => {
  const gate = deferred<ScanResult>();
  const { controller } = makeHistory({ list: async () => pageOf(2), get: () => gate.promise });
  await controller.hydrate();
  const pending = controller.loadDetail(wid(9));
  await controller.deleteSelected([wid(9)]);
  gate.resolve(scan(9));
  await assert.rejects(pending);
  assert.equal(controller.find(wid(9)), undefined);
});

test('deleteSelected: a detail opened earlier (not in the list) is removed from the cache', async () => {
  const { controller } = makeHistory({ list: async () => pageOf(2), get: async () => scan(9) });
  await controller.hydrate();
  await controller.loadDetail(wid(9));
  assert.equal(controller.find(wid(9))?.id, wid(9));
  await controller.deleteSelected([wid(9)]);
  assert.equal(controller.find(wid(9)), undefined);
});

test('deleteSelected: deleting everything that was loaded keeps loading older pages instead of showing "empty"', async () => {
  const cursors: (string | null)[] = [];
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => {
      cursors.push(cursor);
      return cursor ? page([21, 22], null) : page([1, 2], 'c-after-2');
    },
  });
  await controller.hydrate();
  await controller.deleteSelected([wid(1), wid(2)]);
  await tick();
  await tick();
  assert.deepEqual(cursors, [null, 'c-after-2'], 'the cursor still works after its own scan was deleted');
  assert.deepEqual(ids(last().scans), [21, 22].map(wid));
  assert.equal(last().nextCursor, null);
});

test('deleteSelected: if that top-up fails the history is not "empty": more is still there and loadError is set', async () => {
  const { controller, last } = makeHistory({
    list: async ({ cursor }) => {
      if (cursor) throw new ApiError(0, 'NETWORK_ERROR');
      return page([1], 'c1');
    },
  });
  await controller.hydrate();
  await controller.deleteSelected([wid(1)]);
  await tick();
  await tick();
  assert.deepEqual(last().scans, []);
  assert.equal(last().nextCursor, 'c1', 'the UI can offer "Load more" instead of an empty state');
  assert.equal(last().loadError, true);
  assert.equal(last().status, 'ready');
});

test('deleteSelected: logging out while it runs leaves a clean, signed-out controller', async () => {
  const gate = deferred<void>();
  const { controller, last } = makeHistory({ list: async () => pageOf(2), deleteSelected: () => gate.promise });
  await controller.hydrate();
  controller.beginSelection();
  controller.toggleSelected(wid(1));
  const deleting = controller.deleteSelected([wid(1)]);
  controller.reset();
  gate.resolve();
  assert.equal(await deleting, false);
  assert.equal(last().status, 'idle');
  assert.deepEqual(last().scans, []);
  assert.equal(last().selecting, false);
  assert.equal(last().deleting, false);
});

test('deleteSelected: only while the history is loaded', async () => {
  let calls = 0;
  const gate = deferred<Page>();
  const { controller } = makeHistory({ list: () => gate.promise, deleteSelected: async () => { calls += 1; } });
  const loading = controller.hydrate();
  assert.equal(await controller.deleteSelected([wid(1)]), false, 'still loading');
  gate.resolve(pageOf(1));
  await loading;
  assert.equal(calls, 0);
});

// ================================================================== delete account
type Fixture = {
  controller: AccountDeletionController;
  snapshots: AccountDeletionSnapshot[];
  deleted: () => number;
  history: HistoryController;
  profile: ProfileController;
  consent: ConsentController;
};
async function accountFixture(): Promise<Fixture> {
  await signInFake();
  let deleted = 0;
  const snapshots: AccountDeletionSnapshot[] = [];
  const history = new HistoryController({ list: async () => page([1, 2]), get: async () => scan(1), deleteSelected: async () => {}, deleteAll: async () => {} }, () => {});
  const profile = new ProfileController(
    { get: async () => ({ skinType: 'oily', sensitivity: 'sensitive', concerns: ['acne'], ingredientsToAvoid: '' }), put: async (p) => p },
    () => {},
  );
  const consent = new ConsentController({ get: async () => true, put: async (g) => g }, () => {});
  await Promise.all([history.hydrate(), profile.hydrate(), consent.hydrate()]);
  const controller = new AccountDeletionController(
    accountService,
    () => {
      deleted += 1;
      // what the provider's signOut() does
      history.reset();
      profile.reset();
      consent.reset();
    },
    (s) => snapshots.push(s),
  );
  reset();
  return { controller, snapshots, deleted: () => deleted, history, profile, consent };
}
const tokensGone = async () => tokens.getAccessToken() === null && (await tokens.getStoredRefreshToken()) === null;

test('delete account (Google / passwordless): DELETE /account with body {} -> 204 -> signed out locally, no logout call', async () => {
  const f = await accountFixture();
  fake.handler = () => noContent();
  assert.deepEqual(await f.controller.start(), { status: 'deleted' });
  assert.deepEqual(requests.map((r) => `${r.method} ${r.path}`), ['DELETE /account']);
  assert.deepEqual(requests[0]!.body, {});
  assert.equal(requests[0]!.headers.get('authorization'), 'Bearer access-1');
  assert.equal(f.deleted(), 1);
  assert.ok(await tokensGone(), 'access + refresh tokens cleared');
  assert.ok(!paths().includes('/auth/logout'), 'the logout endpoint is not called for a deleted account');
  assert.equal(f.history.find(wire(1).id), undefined);
  assert.equal(f.profile.current, null);
  assert.equal(f.consent.current, null);
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: false });
});

test('delete account (email): INVALID_CREDENTIALS opens the password step, the correct password deletes', async () => {
  const f = await accountFixture();
  fake.handler = (_url, init) =>
    JSON.parse(String(init.body)).password === 'Correct-Password-1' ? noContent() : failure(401, 'INVALID_CREDENTIALS');
  assert.deepEqual(await f.controller.start(), { status: 'needs-password' });
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: true });
  assert.equal(f.deleted(), 0, 'still signed in');
  assert.equal(tokens.getAccessToken(), 'access-1');
  assert.equal(f.history.find(wire(1).id)?.id, wire(1).id, 'local data untouched');

  // wrong password: an error, the step stays open, still signed in
  assert.deepEqual(await f.controller.submitPassword('Wrong-Password-99'), { status: 'failed', kind: 'invalid-credentials' });
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: true });
  assert.equal(f.deleted(), 0);
  assert.equal(await tokens.getStoredRefreshToken(), 'refresh-1');

  // the right one
  assert.deepEqual(await f.controller.submitPassword('Correct-Password-1'), { status: 'deleted' });
  assert.deepEqual(requests.map((r) => r.body), [{}, { password: 'Wrong-Password-99' }, { password: 'Correct-Password-1' }]);
  assert.equal(f.deleted(), 1);
  assert.ok(await tokensGone());
  assert.ok(!paths().includes('/auth/logout'));
  assert.ok(!paths().includes('/auth/refresh'), 'a wrong password never triggers a token refresh');
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: false });
});

test('delete account: a password that cannot be right is not even sent', async () => {
  const f = await accountFixture();
  fake.handler = () => failure(401, 'INVALID_CREDENTIALS');
  await f.controller.start();
  const sent = requests.length;
  assert.deepEqual(await f.controller.submitPassword('short'), { status: 'failed', kind: 'invalid-credentials' });
  assert.deepEqual(await f.controller.submitPassword('x'.repeat(129)), { status: 'failed', kind: 'invalid-credentials' });
  assert.equal(requests.length, sent);
});

test('delete account: STORAGE_UNAVAILABLE / network / unknown failures never sign the user out or clear anything', async () => {
  const f = await accountFixture();
  for (const [respond, kind] of [
    [() => failure(503, 'STORAGE_UNAVAILABLE'), 'storage'],
    [() => { throw new TypeError('offline'); }, 'network'],
    [() => failure(500, 'INTERNAL_ERROR'), 'unknown'],
  ] as const) {
    fake.handler = respond;
    assert.deepEqual(await f.controller.start(), { status: 'failed', kind });
    assert.equal(f.deleted(), 0);
    assert.equal(tokens.getAccessToken(), 'access-1');
    assert.equal(await tokens.getStoredRefreshToken(), 'refresh-1');
    assert.equal(f.history.find(wire(1).id)?.id, wire(1).id);
    assert.equal(f.consent.current, true);
    assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: false }, 'usable again');
  }
  assert.ok(!paths().includes('/auth/logout'));

  // the same failures from the password step keep the step open
  fake.handler = () => failure(401, 'INVALID_CREDENTIALS');
  await f.controller.start();
  fake.handler = () => failure(503, 'STORAGE_UNAVAILABLE');
  assert.deepEqual(await f.controller.submitPassword('Some-Password-1'), { status: 'failed', kind: 'storage' });
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: true });
  assert.equal(f.deleted(), 0);
});

test('delete account: double press — one request while busy; cancel is ignored while busy', async () => {
  const f = await accountFixture();
  const gate = deferred<Response>();
  fake.handler = () => gate.promise;
  const first = f.controller.start();
  assert.deepEqual(await f.controller.start(), { status: 'busy' });
  assert.deepEqual(f.snapshots.at(-1), { busy: true, needsPassword: false });
  gate.resolve(failure(401, 'INVALID_CREDENTIALS'));
  assert.deepEqual(await first, { status: 'needs-password' });
  assert.equal(requests.length, 1);
  assert.deepEqual(await f.controller.start(), { status: 'busy' }, 'not while the password step is open');

  const gate2 = deferred<Response>();
  fake.handler = () => gate2.promise;
  const submit = f.controller.submitPassword('Some-Password-1');
  assert.deepEqual(await f.controller.submitPassword('Some-Password-1'), { status: 'busy' });
  f.controller.cancel();
  assert.equal(f.snapshots.at(-1)!.needsPassword, true, 'cancel ignored while deleting');
  gate2.resolve(noContent());
  assert.deepEqual(await submit, { status: 'deleted' });
  assert.equal(requests.length, 2);
  assert.equal(f.deleted(), 1);
});

test('delete account: cancel closes the password step and the password is never kept by the controller', async () => {
  const f = await accountFixture();
  fake.handler = () => failure(401, 'INVALID_CREDENTIALS');
  await f.controller.start();
  await f.controller.submitPassword('Secret-Password-42');
  f.controller.cancel();
  assert.deepEqual(f.snapshots.at(-1), { busy: false, needsPassword: false });
  assert.deepEqual(await f.controller.submitPassword('Secret-Password-42'), { status: 'busy' }, 'nothing to submit to once closed');
  for (const value of [JSON.stringify(f.controller), JSON.stringify(f.snapshots), JSON.stringify(Object.values(f.controller))]) {
    assert.ok(!value.includes('Secret-Password-42'), 'the password is not stored');
  }
});

// ================================================================== no photo: the data the screens need
test('a scan loaded from the backend has no photo but everything the result screens need', () => {
  const fromBackend = scan(3, { detectionAreas: [], detectedTypes: [], amount: 'none', severity: 'none' });
  assert.equal(fromBackend.photoUri, undefined);
  assert.deepEqual(getDetectedCategories(fromBackend), []);
  assert.equal(en.result.summary(fromBackend.amount, fromBackend.severity), 'No visible acne');
  const withAreas = scan(4);
  assert.deepEqual(getDetectedCategories(withAreas), ['comedonal']);
  assert.equal(en.result.detectedAreaCount(withAreas.detectionAreas.length), '2 areas detected');
  assert.equal(en.result.detectedAreaCount(0), 'No areas detected');
  assert.equal(th.result.detectedAreaCount(2), 'ตรวจพบ 2 บริเวณ');
});
