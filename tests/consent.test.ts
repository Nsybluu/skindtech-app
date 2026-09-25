import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fake, json, requests } from './support/fake-api.ts';

import { ApiError } from '@/services/api-error';
import {
  ConsentController,
  reconcileConsent,
  type ConsentSnapshot,
} from '@/services/consent-controller';
import { consentService } from '@/services/consent.service';
import { scanService } from '@/services/scan.service';
import * as tokens from '@/services/session-token.service';


const consentBody = (granted: unknown) => json(200, { status: 'success', data: { granted } });

// ------------------------------------------------------------------ controller helpers
function deferred<T>() {
  let resolve!: (v: T) => void; let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function makeController(api: { get: () => Promise<boolean>; put: (g: boolean) => Promise<boolean> }) {
  const snapshots: ConsentSnapshot[] = [];
  const controller = new ConsentController(api, (s) => snapshots.push(s));
  return { controller, snapshots, last: () => snapshots[snapshots.length - 1] };
}

// ================================================================== reconcile rule
test('reconcile: a server `false` never becomes a remembered "declined" unless the user said so', () => {
  assert.equal(reconcileConsent(null, true), true);
  assert.equal(reconcileConsent(false, true), true);
  assert.equal(reconcileConsent(null, false), null, 'never asked -> the sheet must still ask');
  assert.equal(reconcileConsent(false, false), false, 'declined in this session stays declined');
  assert.equal(reconcileConsent(true, false), null, 'revoked elsewhere -> not consent, ask again');
});

// ================================================================== controller: hydrate
test('hydrate after login/restore: granted=true -> true; granted=false -> null (sheet asks)', async () => {
  let server = true;
  const { controller, last } = makeController({ get: async () => server, put: async (g) => g });
  await controller.hydrate();
  assert.equal(controller.current, true);
  assert.equal(last().value, true);

  controller.reset();
  server = false;
  await controller.hydrate();
  assert.equal(controller.current, null);
});

test('hydrate failure keeps the current value and does not throw', async () => {
  const { controller } = makeController({ get: async () => { throw new ApiError(0, 'NETWORK_ERROR'); }, put: async (g) => g });
  await controller.hydrate();
  assert.equal(controller.current, null);
});

// ================================================================== controller: save
test('allow: PUT first, value flips only after the backend confirmed, exactly one request', async () => {
  const put = deferred<boolean>();
  const calls: boolean[] = [];
  const { controller, last } = makeController({ get: async () => false, put: (g) => { calls.push(g); return put.promise; } });
  const pending = controller.save(true);
  assert.deepEqual(calls, [true]);
  assert.equal(controller.current, null, 'not consent while the request is still running');
  assert.equal(last().saving, true);
  put.resolve(true);
  assert.equal(await pending, true);
  assert.equal(controller.current, true);
  assert.equal(last().saving, false);
});

test('decline records { granted:false } and the local value follows the confirmation', async () => {
  const calls: boolean[] = [];
  const { controller } = makeController({ get: async () => true, put: async (g) => { calls.push(g); return g; } });
  await controller.hydrate();
  assert.equal(controller.current, true);
  assert.equal(await controller.save(false), false);
  assert.deepEqual(calls, [false]);
  assert.equal(controller.current, false);
});

test('a failed request is NOT consent and does not change the value (allow and decline)', async () => {
  const { controller, last } = makeController({ get: async () => true, put: async () => { throw new ApiError(0, 'NETWORK_ERROR'); } });
  // 1) never answered -> stays null after a failed "allow"
  await assert.rejects(controller.save(true), (e: unknown) => e instanceof ApiError);
  assert.equal(controller.current, null);
  assert.equal(last().saving, false, 'saving must be released so the user can retry');
  // 2) backend still has an older `true`: a failed "decline" must not silently flip local state either
  await controller.hydrate();
  assert.equal(controller.current, true);
  await assert.rejects(controller.save(false));
  assert.equal(controller.current, true, 'unchanged: the backend still holds the old answer, and we did not pretend otherwise');
});

test('double tap: only the first save runs, the second is ignored', async () => {
  const put = deferred<boolean>();
  let puts = 0;
  const { controller } = makeController({ get: async () => false, put: () => { puts += 1; return put.promise; } });
  const first = controller.save(true);
  const second = controller.save(false);          // e.g. "Not now" tapped while "Allow" is being saved
  assert.equal(await second, null);
  put.resolve(true);
  assert.equal(await first, true);
  assert.equal(puts, 1);
  assert.equal(controller.current, true, 'the ignored tap must not have changed anything');
  // and after it finished, a new save works again
  assert.equal(await controller.save(true), true);
  assert.equal(puts, 2);
});

// ================================================================== controller: races
test('a slow read that started before a save must not overwrite the saved answer', async () => {
  const get = deferred<boolean>();
  const { controller } = makeController({ get: () => get.promise, put: async (g) => g });
  const hydrating = controller.hydrate();          // GET in flight (will answer with the OLD value: false)
  assert.equal(await controller.save(true), true); // user answers meanwhile
  get.resolve(false);
  await hydrating;
  assert.equal(controller.current, true);
});

test('sign-out while a save is in flight: the result is dropped and nothing sticks', async () => {
  const put = deferred<boolean>();
  let first = true;
  const { controller, last } = makeController({
    get: async () => false,
    // the first request is the slow one; later requests (new session) answer normally
    put: (g) => (first ? ((first = false), put.promise) : Promise.resolve(g)),
  });
  const pending = controller.save(true);
  controller.reset();                              // signOut()
  assert.equal(last().saving, false);
  put.resolve(true);
  assert.equal(await pending, null);
  assert.equal(controller.current, null, 'the previous user\'s answer must not leak into the next session');
  assert.equal(await controller.save(false), false, 'a new session can save again');
});

test('sign-out/sign-in while a read is in flight: the old user\'s answer is ignored', async () => {
  const oldRead = deferred<boolean>();
  let call = 0;
  const { controller } = makeController({ get: () => (++call === 1 ? oldRead.promise : Promise.resolve(false)), put: async (g) => g });
  const first = controller.hydrate();              // user A
  controller.reset();                              // sign out, then user B signs in
  await controller.hydrate();                      // user B: never granted
  oldRead.resolve(true);                           // A's late answer arrives
  await first;
  assert.equal(controller.current, null);
});

// ================================================================== service: HTTP contract
test('GET /consents/ai-training: bearer token, boolean result', async () => {
  await tokens.storeAuthTokens({ accessToken: 'AT-1', refreshToken: 'RT-1' });
  requests.length = 0;
  fake.handler = () => consentBody(true);
  assert.equal(await consentService.getAiTraining(), true);
  assert.equal(requests[0].path, '/consents/ai-training');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].headers.get('authorization'), 'Bearer AT-1');
});

test('PUT /consents/ai-training: body is exactly { granted } and the confirmation is returned', async () => {
  requests.length = 0;
  fake.handler = (_u, init) => consentBody(JSON.parse(init.body as string).granted);
  assert.equal(await consentService.setAiTraining(true), true);
  assert.equal(await consentService.setAiTraining(false), false);
  assert.deepEqual(requests.map((r) => [r.method, r.path, r.body]), [
    ['PUT', '/consents/ai-training', { granted: true }],
    ['PUT', '/consents/ai-training', { granted: false }],
  ]);
  assert.equal(requests[0].headers.get('content-type'), 'application/json');
});

test('anything that is not a boolean, or a confirmation that disagrees, is an error (never consent)', async () => {
  for (const bad of ['true', 1, null, undefined, {}, 'yes']) {
    fake.handler = () => consentBody(bad);
    await assert.rejects(consentService.getAiTraining(), (e: unknown) => e instanceof ApiError && (e as ApiError).code === 'INVALID_RESPONSE', `GET ${String(bad)}`);
  }
  fake.handler = () => json(200, { status: 'success' });
  await assert.rejects(consentService.getAiTraining(), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
  fake.handler = () => consentBody(false);                 // asked to save `true`, server says `false`
  await assert.rejects(consentService.setAiTraining(true), (e: unknown) => (e as ApiError).code === 'CONSENT_MISMATCH');
  fake.handler = () => consentBody(true);                  // asked to save `false`, server says `true`
  await assert.rejects(consentService.setAiTraining(false), (e: unknown) => (e as ApiError).code === 'CONSENT_MISMATCH');
});

test('HTTP failures surface as ApiError (400 / 500 / network)', async () => {
  fake.handler = () => json(400, { status: 'failed', error: { code: 'VALIDATION_ERROR' } });
  await assert.rejects(consentService.setAiTraining(true), (e: unknown) => (e as ApiError).code === 'VALIDATION_ERROR');
  fake.handler = () => json(500, { status: 'failed', error: { code: 'INTERNAL_ERROR' } });
  await assert.rejects(consentService.setAiTraining(true), (e: unknown) => (e as ApiError).statusCode === 500);
  fake.handler = () => { throw new TypeError('Network request failed'); };
  await assert.rejects(consentService.getAiTraining(), (e: unknown) => (e as ApiError).code === 'NETWORK_ERROR');
});

// ================================================================== scan: what is sent
test('POST /scans sends allowTrainingStorage exactly as decided by the confirmed consent', async () => {
  const cases: [boolean | null, string][] = [[true, 'true'], [false, 'false'], [null, 'false']];
  for (const [consent, expected] of cases) {
    requests.length = 0;
    fake.handler = () => json(200, { status: 'success', result: { id: 's1', detectionAreas: [] } });
    // exactly what analyzing.tsx does: getAiImprovementConsent() === true
    await scanService.analyzePhoto('file:///photo.jpg', null, consent === true);
    const form = requests[0].form!;
    assert.equal(requests[0].path, '/scans');
    assert.equal(form.get('allowTrainingStorage'), expected, `consent=${String(consent)}`);
  }
});
