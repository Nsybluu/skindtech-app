import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ApiError } from '@/services/api-error';
import {
  RecommendationController,
  RULES_CACHE_TTL_MS,
  type RecommendationApi,
  type RecommendationState,
} from '@/services/recommendation-controller';
import { parseRecommendation, recommendationService } from '@/services/recommendation.service';
import * as tokens from '@/services/session-token.service';
import type { CareRecommendation } from '@/types/recommendation';
import { recommendationTarget } from '@/utils/recommendation-target';

import { deferred, failure, fake, json, paths, requests, resetRequests, tick } from './support/fake-api.ts';

const SCAN = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';

/** A recommendation exactly as the backend sends it (rules-v1, no personalization). */
const wire = (scanId = SCAN, over: Record<string, unknown> = {}, content: Record<string, unknown> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  scanId,
  source: 'rules',
  content: {
    version: 'rules-v1',
    basedOn: { amount: 'moderate', severity: 'moderate' },
    morningSteps: ['gentle_cleanser', 'lightweight_moisturizer', 'broad_spectrum_sunscreen'],
    eveningSteps: ['gentle_cleanser', 'optional_acne_care_product', 'lightweight_moisturizer'],
    basics: ['gentle_cleanser', 'lightweight_moisturizer', 'non_comedogenic_spf'],
    habits: ['avoid_picking', 'avoid_harsh_scrubs', 'clean_pillowcases_and_phone'],
    professionalHelp: { recommended: false, reasons: ['painful_worsening_or_persistent'] },
    disclaimer: 'general_care_not_diagnosis',
    ...content,
  },
  createdAt: '2026-09-25T03:00:00.000Z',
  ...over,
});
const llm = (scanId = SCAN) =>
  wire(
    scanId,
    { id: '22222222-2222-4222-8222-222222222222', source: 'llm', createdAt: '2026-09-25T03:00:12.000Z' },
    {
      version: 'rules-v1+llm-v1',
      personalization: {
        summary: { en: 'Keep your routine gentle.', th: 'ดูแลผิวอย่างอ่อนโยนต่อเนื่อง' },
        tips: [{ en: 'Patch-test new products.', th: 'ทดลองใช้ผลิตภัณฑ์ใหม่บริเวณเล็ก ๆ ก่อน' }],
      },
    },
  );
const rec = (scanId = SCAN, source: 'rules' | 'llm' = 'rules'): CareRecommendation =>
  parseRecommendation(source === 'llm' ? llm(scanId) : wire(scanId), scanId);
const invalid = (error: unknown) => error instanceof ApiError && error.code === 'INVALID_RESPONSE';

// ------------------------------------------------------------------ parser
test('parser accepts the rules response as sent', () => {
  const parsed = parseRecommendation(wire(), SCAN);
  assert.equal(parsed.source, 'rules');
  assert.equal(parsed.content.version, 'rules-v1');
  assert.deepEqual(parsed.content.basedOn, { amount: 'moderate', severity: 'moderate' });
  assert.deepEqual(parsed.content.morningSteps, ['gentle_cleanser', 'lightweight_moisturizer', 'broad_spectrum_sunscreen']);
  assert.equal(parsed.content.professionalHelp.recommended, false);
  assert.equal(parsed.content.personalization, undefined, 'personalization is optional');
  assert.equal(parsed.createdAt, '2026-09-25T03:00:00.000Z');
});

test('parser accepts an LLM personalization and keeps both languages', () => {
  const parsed = parseRecommendation(llm(), SCAN);
  assert.equal(parsed.source, 'llm');
  assert.equal(parsed.content.version, 'rules-v1+llm-v1');
  assert.deepEqual(parsed.content.personalization, {
    summary: { en: 'Keep your routine gentle.', th: 'ดูแลผิวอย่างอ่อนโยนต่อเนื่อง' },
    tips: [{ en: 'Patch-test new products.', th: 'ทดลองใช้ผลิตภัณฑ์ใหม่บริเวณเล็ก ๆ ก่อน' }],
  });
});

test('parser accepts a severe pattern with reasons and the other enum values', () => {
  const parsed = parseRecommendation(
    wire(SCAN, {}, {
      basedOn: { amount: 'high', severity: 'severe' },
      eveningSteps: ['gentle_cleanser', 'lightweight_moisturizer'],
      professionalHelp: { recommended: true, reasons: ['severe_pattern', 'nodules_detected', 'painful_worsening_or_persistent'] },
    }),
    SCAN,
  );
  assert.equal(parsed.content.professionalHelp.recommended, true);
  assert.equal(parsed.content.professionalHelp.reasons.length, 3);
});

test('parser rejects a wrong scanId, and compares ids case-insensitively', () => {
  assert.throws(() => parseRecommendation(wire(OTHER), SCAN), invalid);
  assert.equal(parseRecommendation(wire(SCAN.toUpperCase()), SCAN).scanId, SCAN.toUpperCase());
  assert.throws(() => parseRecommendation(wire(undefined as unknown as string, { scanId: 42 }), SCAN), invalid);
});

test('parser rejects a wrong createdAt, id, source, version and disclaimer', () => {
  const bad: [string, unknown][] = [
    ['createdAt not a date', wire(SCAN, { createdAt: 'yesterday' })],
    ['createdAt missing', wire(SCAN, { createdAt: undefined })],
    ['createdAt a number', wire(SCAN, { createdAt: 1758769200000 })],
    ['id blank', wire(SCAN, { id: '  ' })],
    ['id missing', wire(SCAN, { id: undefined })],
    ['source unknown', wire(SCAN, { source: 'human' })],
    ['version unknown', wire(SCAN, {}, { version: 'rules-v2' })],
    ['disclaimer unknown', wire(SCAN, {}, { disclaimer: 'medical_advice' })],
    ['disclaimer missing', wire(SCAN, {}, { disclaimer: undefined })],
    ['not an object', 'recommendation'],
    ['null', null],
    ['content missing', wire(SCAN, { content: undefined })],
  ];
  for (const [label, value] of bad) assert.throws(() => parseRecommendation(value, SCAN), invalid, label);
});

test('parser rejects semantic keys and enums it cannot translate — nothing raw ever reaches the screen', () => {
  const bad: [string, Record<string, unknown>][] = [
    ['unknown morning step', { morningSteps: ['gentle_cleanser', 'take_antibiotics'] }],
    ['unknown evening step', { eveningSteps: ['retinoid_cream'] }],
    ['unknown basic', { basics: ['gentle_cleanser', 'expensive_serum'] }],
    ['unknown habit', { habits: ['avoid_picking', 'sleep_less'] }],
    ['unknown reason', { professionalHelp: { recommended: true, reasons: ['looks_bad'] } }],
    ['step in the wrong case', { morningSteps: ['Gentle_Cleanser'] }],
    ['basedOn amount unknown', { basedOn: { amount: 'extreme', severity: 'mild' } }],
    ['basedOn severity unknown', { basedOn: { amount: 'mild', severity: 'critical' } }],
    ['basedOn missing', { basedOn: undefined }],
    ['professionalHelp.recommended not boolean', { professionalHelp: { recommended: 'yes', reasons: [] } }],
    ['professionalHelp missing', { professionalHelp: undefined }],
    ['reasons not an array', { professionalHelp: { recommended: false, reasons: 'painful' } }],
    ['morningSteps a string', { morningSteps: 'gentle_cleanser' }],
    ['a step that is not a string', { morningSteps: [1] }],
  ];
  for (const [label, content] of bad) assert.throws(() => parseRecommendation(wire(SCAN, {}, content), SCAN), invalid, label);
});

test('parser never accepts an empty recommendation', () => {
  for (const content of [{ morningSteps: [] }, { eveningSteps: [] }, { basics: [] }, { habits: [] }]) {
    assert.throws(() => parseRecommendation(wire(SCAN, {}, content), SCAN), invalid, JSON.stringify(content));
  }
});

test('parser rejects malformed personalization instead of showing blank advice', () => {
  const summary = { en: 'Hello', th: 'สวัสดี' };
  const tip = { en: 'Tip', th: 'เคล็ดลับ' };
  const bad: [string, unknown][] = [
    ['not an object', 'Be gentle'],
    ['summary missing', { tips: [tip] }],
    ['summary blank en', { summary: { en: '   ', th: 'สวัสดี' }, tips: [tip] }],
    ['summary blank th', { summary: { en: 'Hello', th: '' }, tips: [tip] }],
    ['summary th missing', { summary: { en: 'Hello' }, tips: [tip] }],
    ['summary not localized', { summary: 'Hello', tips: [tip] }],
    ['tips missing', { summary }],
    ['tips empty', { summary, tips: [] }],
    ['tips not an array', { summary, tips: tip }],
    ['a tip blank', { summary, tips: [tip, { en: '', th: 'x' }] }],
    ['a tip a plain string', { summary, tips: ['Be gentle'] }],
    ['a tip with a number', { summary, tips: [{ en: 1, th: 2 }] }],
    ['far too many tips', { summary, tips: Array.from({ length: 11 }, () => tip) }],
    ['absurdly long text', { summary: { en: 'x'.repeat(1001), th: 'ก' }, tips: [tip] }],
  ];
  for (const [label, personalization] of bad) {
    assert.throws(() => parseRecommendation(wire(SCAN, { source: 'llm' }, { version: 'rules-v1+llm-v1', personalization }), SCAN), invalid, label);
  }
});

test('personalization text is trimmed, and null personalization means "rules only"', () => {
  const parsed = parseRecommendation(
    wire(SCAN, {}, { personalization: { summary: { en: '  Hi  ', th: ' สวัสดี ' }, tips: [{ en: ' a ', th: ' ก ' }] } }),
    SCAN,
  );
  assert.deepEqual(parsed.content.personalization!.summary, { en: 'Hi', th: 'สวัสดี' });
  assert.equal(parseRecommendation(wire(SCAN, {}, { personalization: null }), SCAN).content.personalization, undefined);
});

// ------------------------------------------------------------------ service
test('service: a plain authenticated GET (no body, no profile, no image), id URL-encoded', async () => {
  await tokens.storeAuthTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  resetRequests();
  fake.handler = () => json(200, { status: 'success', data: { recommendation: wire() } });
  const result = await recommendationService.getRecommendation(SCAN);
  assert.equal(result.scanId, SCAN);
  assert.equal(requests.length, 1);
  assert.equal(requests[0]!.method, 'GET');
  assert.equal(requests[0]!.path, `/scans/${SCAN}/recommendation`);
  assert.equal(requests[0]!.body, undefined, 'a GET carries nothing');
  assert.equal(requests[0]!.form, undefined);
  assert.equal(requests[0]!.headers.get('authorization'), 'Bearer access-1');

  resetRequests();
  await recommendationService.getRecommendation('a/b?c').catch(() => undefined);
  assert.equal(requests[0]!.path, '/scans/a%2Fb%3Fc/recommendation', 'an id can never change the path');
});

test('service: goes through the normal session flow — an expired token is refreshed once and retried', async () => {
  await tokens.storeAuthTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  resetRequests();
  fake.handler = (url, init) => {
    if (url.endsWith('/auth/refresh')) return json(200, { status: 'success', data: { accessToken: 'access-2', refreshToken: 'refresh-2' } });
    return new Headers(init.headers).get('authorization') === 'Bearer access-1'
      ? failure(401, 'UNAUTHORIZED')
      : json(200, { status: 'success', data: { recommendation: wire() } });
  };
  assert.equal((await recommendationService.getRecommendation(SCAN)).scanId, SCAN);
  assert.deepEqual(paths(), [`/scans/${SCAN}/recommendation`, '/auth/refresh', `/scans/${SCAN}/recommendation`]);
});

test('service: 404 RECOMMENDATION_NOT_FOUND, network errors and malformed answers stay distinct', async () => {
  await tokens.storeAuthTokens({ accessToken: 'a', refreshToken: 'r' });
  fake.handler = () => failure(404, 'RECOMMENDATION_NOT_FOUND');
  await assert.rejects(recommendationService.getRecommendation(SCAN), (e: unknown) => (e as ApiError).code === 'RECOMMENDATION_NOT_FOUND' && (e as ApiError).statusCode === 404);
  fake.handler = () => {
    throw new TypeError('offline');
  };
  await assert.rejects(recommendationService.getRecommendation(SCAN), (e: unknown) => (e as ApiError).code === 'NETWORK_ERROR');
  fake.handler = () => json(200, { status: 'success', data: { recommendation: wire(OTHER) } });
  await assert.rejects(recommendationService.getRecommendation(SCAN), invalid);
  fake.handler = () => json(200, { status: 'success', data: {} });
  await assert.rejects(recommendationService.getRecommendation(SCAN), invalid);
  fake.handler = () => failure(500, 'INTERNAL_ERROR');
  await assert.rejects(recommendationService.getRecommendation(SCAN), (e: unknown) => (e as ApiError).code === 'INTERNAL_ERROR');
});

// ------------------------------------------------------------------ controller
function make(get: RecommendationApi['get'], now: () => number = () => 0) {
  const controller = new RecommendationController({ get }, now);
  const seen: RecommendationState[] = [];
  controller.subscribe(() => seen.push(controller.get(SCAN)));
  return { controller, seen };
}

test('idle -> loading -> ready, with one request', async () => {
  let calls = 0;
  const gate = deferred<CareRecommendation>();
  const { controller } = make(() => {
    calls += 1;
    return gate.promise;
  });
  assert.equal(controller.get(SCAN).status, 'idle');
  const loading = controller.load(SCAN);
  assert.equal(controller.get(SCAN).status, 'loading');
  gate.resolve(rec());
  await loading;
  const state = controller.get(SCAN);
  assert.equal(state.status, 'ready');
  assert.equal(state.status === 'ready' && state.recommendation.source, 'rules');
  assert.equal(calls, 1);
  await controller.load(SCAN);                       // ready: nothing more to ask
  assert.equal(calls, 1);
});

test('the state object is stable until something changes (as useSyncExternalStore requires)', async () => {
  const { controller } = make(async () => rec());
  await controller.load(SCAN);
  assert.equal(controller.get(SCAN), controller.get(SCAN));
  assert.equal(controller.get(undefined), controller.get(undefined));
});

test('loads are single-flight: many callers, one request', async () => {
  let calls = 0;
  const gate = deferred<CareRecommendation>();
  const { controller } = make(() => {
    calls += 1;
    return gate.promise;
  });
  const all = [controller.load(SCAN), controller.load(SCAN), controller.load(SCAN.toUpperCase()), controller.retry(SCAN)];
  gate.resolve(rec());
  await Promise.all(all);
  assert.equal(calls, 1);
});

test('failure -> error -> Retry -> ready (network, session and unknown map to a kind)', async () => {
  const errors = [new ApiError(0, 'NETWORK_ERROR'), new ApiError(401, 'UNAUTHORIZED'), new ApiError(500, 'INTERNAL_ERROR')];
  const kinds = ['network', 'session', 'unknown'];
  for (const [index, error] of errors.entries()) {
    let failing = true;
    const { controller } = make(async () => {
      if (failing) throw error;
      return rec();
    });
    await controller.load(SCAN);
    const state = controller.get(SCAN);
    assert.deepEqual(state, { status: 'error', kind: kinds[index] });
    failing = false;
    await controller.retry(SCAN);
    assert.equal(controller.get(SCAN).status, 'ready');
  }
});

test('a malformed answer is an error, not an empty recommendation', async () => {
  const { controller } = make(async () => {
    throw new ApiError(502, 'INVALID_RESPONSE');
  });
  await controller.load(SCAN);
  assert.equal(controller.get(SCAN).status, 'error');
});

test('RECOMMENDATION_NOT_FOUND is its own state, and Retry can recover from it', async () => {
  let exists = false;
  const { controller } = make(async () => {
    if (!exists) throw new ApiError(404, 'RECOMMENDATION_NOT_FOUND');
    return rec();
  });
  await controller.load(SCAN);
  assert.deepEqual(controller.get(SCAN), { status: 'not-found' });
  exists = true;
  await controller.retry(SCAN);
  assert.equal(controller.get(SCAN).status, 'ready');
});

test('Retry does nothing to an answer that is already there', async () => {
  let calls = 0;
  const { controller } = make(async () => {
    calls += 1;
    return rec();
  });
  await controller.load(SCAN);
  await controller.retry(SCAN);
  assert.equal(calls, 1);
});

test('an answer for an old scan never lands on the new scan', async () => {
  const gateA = deferred<CareRecommendation>();
  const gateB = deferred<CareRecommendation>();
  const controller = new RecommendationController({ get: (id) => (id === SCAN ? gateA.promise : gateB.promise) });
  const a = controller.load(SCAN);                   // user opens scan A ...
  const b = controller.load(OTHER);                  // ... and moves on to scan B
  gateB.resolve(rec(OTHER));
  await b;
  gateA.resolve(rec(SCAN));                          // A's slow answer arrives afterwards
  await a;
  const stateB = controller.get(OTHER);
  assert.equal(stateB.status === 'ready' && stateB.recommendation.scanId, OTHER, 'B kept B\'s own answer');
  const stateA = controller.get(SCAN);
  assert.equal(stateA.status === 'ready' && stateA.recommendation.scanId, SCAN, 'and A\'s answer belongs to A');
});

test('a late answer cannot resurrect a scan after sign-out or deletion', async () => {
  const gate = deferred<CareRecommendation>();
  const controller = new RecommendationController({ get: () => gate.promise });
  let notified = 0;
  controller.subscribe(() => (notified += 1));
  const loading = controller.load(SCAN);
  controller.reset();                                // sign-out
  const afterReset = notified;
  gate.resolve(rec());
  await loading;
  assert.equal(controller.get(SCAN).status, 'idle');
  assert.equal(notified, afterReset, 'the stale answer did not even wake the screens');

  const gate2 = deferred<CareRecommendation>();
  const second = new RecommendationController({ get: () => gate2.promise });
  const loading2 = second.load(SCAN);
  second.forget([SCAN]);                             // the scan was deleted
  gate2.resolve(rec());
  await loading2;
  assert.equal(second.get(SCAN).status, 'idle');
});

test('a state change notifies subscribers, and unsubscribing stops it', async () => {
  const { controller, seen } = make(async () => rec());
  await controller.load(SCAN);
  assert.deepEqual(seen.map((state) => state.status), ['loading', 'ready']);
  const before = seen.length;
  const stop = controller.subscribe(() => seen.push({ status: 'idle' }));
  stop();
  controller.reset();
  assert.equal(seen.length, before + 1, 'only the first listener heard the reset');
});

// ---- the one background refresh (personalization arrives after the rules answer)
test('a screen reacting to the first answer already sees that the one refresh is allowed (as the hook does)', async () => {
  const controller = new RecommendationController({ get: async () => rec() });
  const seenByListener: boolean[] = [];
  controller.subscribe(() => {
    // exactly what `useRecommendation` asks, synchronously, when the state changes to ready
    if (controller.get(SCAN).status === 'ready') seenByListener.push(controller.needsRefresh(SCAN));
  });
  await controller.load(SCAN);
  assert.deepEqual(seenByListener, [true], 'needsRefresh must already be true inside the notification');
});

test('the same holds for an answer that arrives synchronously and for a renewed answer', async () => {
  const sync = new RecommendationController({ get: () => ({ then: (ok: (value: CareRecommendation) => void) => ok(rec()) }) as unknown as Promise<CareRecommendation> });
  const seen: boolean[] = [];
  sync.subscribe(() => {
    if (sync.get(SCAN).status === 'ready') seen.push(sync.needsRefresh(SCAN));
  });
  await sync.load(SCAN);
  assert.deepEqual(seen, [true]);
});

test('a rules answer is refreshed in the background exactly once, and upgraded when personalization arrived', async () => {
  let calls = 0;
  const { controller, seen } = make(async () => {
    calls += 1;
    return rec(SCAN, calls === 1 ? 'rules' : 'llm');
  });
  await controller.load(SCAN);
  assert.equal(controller.needsRefresh(SCAN), true);
  const shown = controller.get(SCAN);

  const refreshing = controller.refreshOnce(SCAN);
  assert.equal(controller.get(SCAN), shown, 'no spinner: the rules answer stays on screen while it runs');
  assert.equal(controller.needsRefresh(SCAN), false, 'the refresh is spent as soon as it starts');
  await refreshing;
  const upgraded = controller.get(SCAN);
  assert.equal(upgraded.status === 'ready' && upgraded.recommendation.source, 'llm');
  assert.ok(upgraded.status === 'ready' && upgraded.recommendation.content.personalization);

  await controller.refreshOnce(SCAN);
  await controller.refreshOnce(SCAN);
  assert.equal(calls, 2, 'one first answer + one refresh, never more');
  assert.equal(seen.filter((state) => state.status === 'loading').length, 1, 'the UI never went back to "loading"');
});

test('with Ollama off the refresh returns rules again: nothing changes and no second refresh happens', async () => {
  let calls = 0;
  const { controller } = make(async () => {
    calls += 1;
    return rec(SCAN, 'rules');
  });
  await controller.load(SCAN);
  const shown = controller.get(SCAN);
  await controller.refreshOnce(SCAN);
  assert.equal(controller.get(SCAN), shown, 'the rules recommendation stays as it was');
  assert.equal(controller.get(SCAN).status, 'ready');
  await controller.refreshOnce(SCAN);
  await controller.refreshOnce(SCAN);
  assert.equal(calls, 2);
  assert.equal(controller.needsRefresh(SCAN), false);
});

test('a failing refresh keeps the rules answer and is not retried', async () => {
  let calls = 0;
  const { controller } = make(async () => {
    calls += 1;
    if (calls > 1) throw new ApiError(0, 'NETWORK_ERROR');
    return rec();
  });
  await controller.load(SCAN);
  await controller.refreshOnce(SCAN);
  assert.equal(controller.get(SCAN).status, 'ready');
  await controller.refreshOnce(SCAN);
  assert.equal(calls, 2);
});

test('an LLM answer never needs a refresh, and neither does an error or a missing scan', async () => {
  const { controller } = make(async () => rec(SCAN, 'llm'));
  await controller.load(SCAN);
  assert.equal(controller.needsRefresh(SCAN), false);
  await controller.refreshOnce(SCAN);
  assert.equal(controller.needsRefresh(OTHER), false);
  const failing = new RecommendationController({ get: async () => { throw new ApiError(0, 'NETWORK_ERROR'); } });
  await failing.load(SCAN);
  assert.equal(failing.needsRefresh(SCAN), false);
});

test('a refresh that lands after sign-out is dropped', async () => {
  const gate = deferred<CareRecommendation>();
  let calls = 0;
  const controller = new RecommendationController({
    get: () => (++calls === 1 ? Promise.resolve(rec()) : gate.promise),
  });
  await controller.load(SCAN);
  const refreshing = controller.refreshOnce(SCAN);
  controller.reset();
  gate.resolve(rec(SCAN, 'llm'));
  await refreshing;
  assert.equal(controller.get(SCAN).status, 'idle');
});

test('an old rules answer is renewed (once, quietly) when its screen opens again; an LLM one never is', async () => {
  let time = 0;
  let calls = 0;
  const controller = new RecommendationController({ get: async () => { calls += 1; return rec(SCAN, calls >= 2 ? 'llm' : 'rules'); } }, () => time);
  await controller.load(SCAN);
  await controller.refreshOnce(SCAN);                // Ollama was still busy: rules again? (here: llm arrives)
  assert.equal(calls, 2);

  const fresh = new RecommendationController({ get: async () => { calls += 1; return rec(SCAN, 'rules'); } }, () => time);
  calls = 0;
  await fresh.load(SCAN);
  await fresh.load(SCAN);                            // within the TTL: no request
  assert.equal(calls, 1);
  time += RULES_CACHE_TTL_MS + 1;
  const before = fresh.get(SCAN);
  const renewing = fresh.load(SCAN);
  assert.equal(fresh.get(SCAN), before, 'the old answer stays on screen while it is renewed');
  await renewing;
  assert.equal(calls, 2);
  assert.equal(fresh.needsRefresh(SCAN), true, 'the renewed answer earns its own single refresh');
});

test('forget() drops only the named scans', async () => {
  const { controller } = make(async (id) => rec(id));
  await controller.load(SCAN);
  await controller.load(OTHER);
  controller.forget([SCAN]);
  assert.equal(controller.get(SCAN).status, 'idle');
  assert.equal(controller.get(OTHER).status, 'ready');
});

// ------------------------------------------------------------------ demo results
test('a demo scan asks for nothing: no id, no request, state stays idle', async () => {
  assert.equal(recommendationTarget({ id: 'demo-123', isDemoData: true }), undefined);
  assert.equal(recommendationTarget(undefined), undefined);
  assert.equal(recommendationTarget({ id: SCAN }), SCAN);
  assert.equal(recommendationTarget({ id: SCAN, isDemoData: false }), SCAN);

  resetRequests();
  fake.handler = () => {
    throw new Error('the backend must not be called for demo data');
  };
  const controller = new RecommendationController({ get: (id) => recommendationService.getRecommendation(id) });
  const target = recommendationTarget({ id: 'demo-123', isDemoData: true });
  assert.equal(controller.get(target).status, 'idle');
  if (target) await controller.load(target);          // what the hook does; it never gets here for demo data
  await tick();
  assert.equal(requests.length, 0);
});
