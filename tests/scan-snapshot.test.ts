import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiError } from '@/services/api-error';
import { HistoryController, type HistoryApi, type HistorySnapshot } from '@/services/history-controller';
import { ProfileController } from '@/services/profile-controller';
import { profileService } from '@/services/profile.service';
import { parseScan, scanHistoryService } from '@/services/scan-history.service';
import { scanService } from '@/services/scan.service';
import * as tokens from '@/services/session-token.service';
import type { SkinProfile } from '@/types/profile';
import type { ScanResult } from '@/types/scan';

import { fake, json } from './support/fake-api.ts';

const SNAPSHOT: SkinProfile = {
  skinType: 'oily',
  sensitivity: 'notSensitive',
  concerns: ['acne', 'excessOil'],
  ingredientsToAvoid: 'fragrance, alcohol',
};
const CURRENT: SkinProfile = {
  skinType: 'dry',
  sensitivity: 'sensitive',
  concerns: ['dryness'],
  ingredientsToAvoid: '',
};

/** A scan exactly as the backend sends it, with a snapshot unless told otherwise. */
const wire = (n: number, over: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  scannedAt: new Date(Date.UTC(2026, 8, 25, 10, 0, 0) - n * 60_000).toISOString(),
  modelVersion: 'yolov8s-p2-20260918',
  skinProfileSnapshot: SNAPSHOT,
  image: { width: 416, height: 520 },
  amount: 'mild',
  severity: 'mild',
  detectedTypes: [{ type: 'comedone', confidence: 0.61, count: 2 }],
  detectionAreas: [{ id: `d-${n}`, category: 'comedonal', box: { x: 0.1, y: 0.2, width: 0.05, height: 0.05 } }],
  ...over,
});
const invalid = (error: unknown) => error instanceof ApiError && error.code === 'INVALID_RESPONSE' && error.statusCode === 502;

// ------------------------------------------------------------------ the strict parser
test('parseScan keeps a well-formed snapshot, field by field', () => {
  const scan = parseScan(wire(1));
  assert.deepEqual(scan.skinProfileSnapshot, SNAPSHOT);
  assert.notEqual(scan.skinProfileSnapshot, SNAPSHOT, 'a copy, never the response object');
  assert.notEqual(scan.skinProfileSnapshot!.concerns, SNAPSHOT.concerns);
});

test('parseScan accepts null: "no profile was saved" is a valid answer and stays null', () => {
  assert.equal(parseScan(wire(1, { skinProfileSnapshot: null })).skinProfileSnapshot, null);
});

test('parseScan copies only the known snapshot fields', () => {
  const scan = parseScan(wire(1, { skinProfileSnapshot: { ...SNAPSHOT, email: 'a@b.c', userId: 'x' } }));
  assert.deepEqual(Object.keys(scan.skinProfileSnapshot!).sort(), ['concerns', 'ingredientsToAvoid', 'sensitivity', 'skinType']);
});

test('parseScan rejects a missing, malformed or wrongly typed snapshot — it is never turned into null', () => {
  const bad: [string, unknown][] = [
    ['missing', undefined],
    ['a string', 'oily'],
    ['a number', 7],
    ['an array', []],
    ['empty object', {}],
    ['unknown skinType', { ...SNAPSHOT, skinType: 'greasy' }],
    ['unknown sensitivity', { ...SNAPSHOT, sensitivity: 'very' }],
    ['skinType missing', { sensitivity: 'sensitive', concerns: [], ingredientsToAvoid: '' }],
    ['unknown concern', { ...SNAPSHOT, concerns: ['acne', 'wrinkles'] }],
    ['concerns not an array', { ...SNAPSHOT, concerns: 'acne' }],
    ['concerns missing', { skinType: 'oily', sensitivity: 'sensitive', ingredientsToAvoid: '' }],
    ['ingredients missing', { skinType: 'oily', sensitivity: 'sensitive', concerns: [] }],
    ['ingredients not a string', { ...SNAPSHOT, ingredientsToAvoid: ['fragrance'] }],
    ['skinType wrong case', { ...SNAPSHOT, skinType: 'Oily' }],
  ];
  for (const [label, snapshot] of bad) {
    const body = { ...wire(1), skinProfileSnapshot: snapshot };
    if (snapshot === undefined) delete (body as Record<string, unknown>).skinProfileSnapshot;
    assert.throws(() => parseScan(body), invalid, label);
  }
});

test('an empty concerns list and empty ingredients are valid', () => {
  const scan = parseScan(wire(1, { skinProfileSnapshot: { ...SNAPSHOT, concerns: [], ingredientsToAvoid: '' } }));
  assert.deepEqual(scan.skinProfileSnapshot!.concerns, []);
});

// ------------------------------------------------------------------ the three endpoints
test('GET /scans and GET /scans/:id both return the snapshot, and one bad scan poisons the page', async () => {
  await tokens.storeAuthTokens({ accessToken: 'a', refreshToken: 'r' });
  fake.handler = () => json(200, { status: 'success', data: { scans: [wire(1), wire(2, { skinProfileSnapshot: null })], nextCursor: null } });
  const page = await scanHistoryService.listScans();
  assert.deepEqual(page.scans.map((scan) => scan.skinProfileSnapshot), [SNAPSHOT, null]);

  fake.handler = () => json(200, { status: 'success', data: { scan: wire(1) } });
  assert.deepEqual((await scanHistoryService.getScan(wire(1).id)).skinProfileSnapshot, SNAPSHOT);

  fake.handler = () => json(200, { status: 'success', data: { scans: [wire(1), wire(2, { skinProfileSnapshot: { skinType: 'x' } })], nextCursor: null } });
  await assert.rejects(scanHistoryService.listScans(), invalid);
  fake.handler = () => json(200, { status: 'success', data: { scan: { ...wire(1), skinProfileSnapshot: undefined } } });
  await assert.rejects(scanHistoryService.getScan(wire(1).id), invalid);
});

test('POST /scans: a new scan carries the snapshot into the app, next to its local photo', async () => {
  await tokens.storeAuthTokens({ accessToken: 'a', refreshToken: 'r' });
  fake.handler = () => json(201, { status: 'success', result: wire(1) });
  const outcome = await scanService.analyzePhoto('file:///photo.jpg', CURRENT, false);
  assert.equal(outcome.status, 'success');
  if (outcome.status !== 'success') return;
  // What the backend stored (the profile sent with the scan) — not what the app happens to hold now.
  assert.deepEqual(outcome.result.skinProfileSnapshot, SNAPSHOT);
  assert.equal(outcome.result.photoUri, 'file:///photo.jpg');
  assert.equal(outcome.result.isDemoData, undefined);
});

test('POST /scans: a result without a valid snapshot is a failed analysis, never a demo result', async () => {
  await tokens.storeAuthTokens({ accessToken: 'a', refreshToken: 'r' });
  for (const result of [{ ...wire(1), skinProfileSnapshot: undefined }, wire(1, { skinProfileSnapshot: { skinType: 'oily' } })]) {
    fake.handler = () => json(201, { status: 'success', result });
    const outcome = await scanService.analyzePhoto('file:///photo.jpg', null, false);
    assert.deepEqual(outcome, { status: 'failed', reason: 'unknown' });
  }
});

// ------------------------------------------------------------------ state: memory, history, detail
function makeHistory(api: Partial<HistoryApi> = {}) {
  const snapshots: HistorySnapshot[] = [];
  const controller = new HistoryController(
    {
      list: async () => ({ scans: [], nextCursor: null }),
      get: async () => {
        throw new ApiError(404, 'SCAN_NOT_FOUND');
      },
      deleteSelected: async () => {},
      deleteAll: async () => {},
      ...api,
    },
    (snapshot) => snapshots.push(snapshot),
  );
  return { controller, last: () => snapshots[snapshots.length - 1]! };
}
const scanOf = (n: number, over: Partial<ScanResult> = {}): ScanResult => ({ ...(parseScan(wire(n)) as ScanResult), ...over });

test('a new scan is kept in state with its snapshot, and history/refresh do not disturb it', async () => {
  const { controller, last } = makeHistory({ list: async () => ({ scans: [scanOf(2)], nextCursor: null }) });
  await controller.hydrate();
  controller.add(scanOf(1, { photoUri: 'file:///p.jpg' }));
  assert.deepEqual(last().scans[0]!.skinProfileSnapshot, SNAPSHOT);
  await controller.refresh();
  assert.deepEqual(controller.find(scanOf(2).id)!.skinProfileSnapshot, SNAPSHOT);
});

test('history and detail views of the same scan show the same snapshot (memory, list, deep link)', async () => {
  const stored = scanOf(1);
  const { controller } = makeHistory({
    list: async () => ({ scans: [stored], nextCursor: null }),
    get: async () => scanOf(9),
  });
  const fromMemory = { ...stored, photoUri: 'file:///photo.jpg' };
  controller.add(fromMemory);
  await controller.hydrate();
  const fromList = controller.find(stored.id)!;
  const fromDetail = await controller.loadDetail(scanOf(9).id);          // deep link to a scan not in the list
  assert.deepEqual(fromMemory.skinProfileSnapshot, fromList.skinProfileSnapshot);
  assert.deepEqual(fromList.skinProfileSnapshot, fromDetail.skinProfileSnapshot);
});

test('editing the CURRENT profile never changes an old scan\'s snapshot (in memory or after a reload)', async () => {
  const profile = new ProfileController(
    { get: async () => SNAPSHOT, put: async (next) => next },
    () => {},
  );
  const backend = new Map<string, ScanResult>([[scanOf(1).id, scanOf(1)]]);
  const { controller, last } = makeHistory({
    list: async () => ({ scans: [...backend.values()], nextCursor: null }),
    get: async (id) => backend.get(id)!,
  });
  await Promise.all([profile.hydrate(), controller.hydrate()]);
  const before = structuredClone(controller.find(scanOf(1).id)!.skinProfileSnapshot);
  assert.deepEqual(before, SNAPSHOT);

  await profile.save(CURRENT);                                            // the user edits their profile
  assert.deepEqual(profile.current, CURRENT);
  assert.deepEqual(controller.find(scanOf(1).id)!.skinProfileSnapshot, SNAPSHOT, 'unchanged in memory');

  await controller.refresh();                                             // "relaunch": the backend is asked again
  assert.deepEqual(last().scans[0]!.skinProfileSnapshot, SNAPSHOT, 'unchanged after reloading from the backend');
  assert.notDeepEqual(last().scans[0]!.skinProfileSnapshot, profile.current);
});

test('a scan made after the edit carries the new profile, the earlier one keeps the old', async () => {
  const { controller } = makeHistory({ list: async () => ({ scans: [scanOf(1)], nextCursor: null }) });
  await controller.hydrate();
  const newer = scanOf(2, { skinProfileSnapshot: CURRENT });
  controller.add(newer);
  assert.deepEqual(controller.find(scanOf(1).id)!.skinProfileSnapshot, SNAPSHOT);
  assert.deepEqual(controller.find(newer.id)!.skinProfileSnapshot, CURRENT);
});

test('saving the profile goes through the same strict parser (shared with the snapshot)', async () => {
  await tokens.storeAuthTokens({ accessToken: 'a', refreshToken: 'r' });
  fake.handler = () => json(200, { status: 'success', data: { profile: { ...CURRENT, skinType: 'greasy' } } });
  await assert.rejects(profileService.getSkinProfile(), invalid);
  fake.handler = () => json(200, { status: 'success', data: { profile: CURRENT } });
  assert.deepEqual(await profileService.getSkinProfile(), CURRENT);
});
