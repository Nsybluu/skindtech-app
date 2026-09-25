import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fake, json, requests } from './support/fake-api.ts';

import { ApiError } from '@/services/api-error';
import * as auth from '@/services/auth.service';
import {
  ConsentController,
} from '@/services/consent-controller';
import { consentService } from '@/services/consent.service';
import {
  ProfileController,
  type ProfileSnapshot,
} from '@/services/profile-controller';
import { profileService } from '@/services/profile.service';
import { scanService } from '@/services/scan.service';
import * as tokens from '@/services/session-token.service';
import type { SkinProfile } from '@/types/profile';


const profileBody = (profile: unknown) => json(200, { status: 'success', data: { profile } });

const PROFILE: SkinProfile = { skinType: 'combination', sensitivity: 'sensitive', concerns: ['acne', 'redness'], ingredientsToAvoid: 'fragrance, alcohol' };
const OTHER: SkinProfile = { skinType: 'oily', sensitivity: 'notSensitive', concerns: ['excessOil'], ingredientsToAvoid: '' };

// ------------------------------------------------------------------ controller helpers
function deferred<T>() {
  let resolve!: (v: T) => void; let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
type Api = { get: () => Promise<SkinProfile | null>; put: (p: SkinProfile) => Promise<SkinProfile> };
function make(api: Api) {
  const snapshots: ProfileSnapshot[] = [];
  const controller = new ProfileController(api, (s) => snapshots.push(s));
  return { controller, snapshots, last: () => snapshots[snapshots.length - 1] };
}
const echo = async (p: SkinProfile) => p;

// ================================================================== controller: hydrate
test('hydrate after sign-in: an existing profile is loaded, status goes loading -> ready', async () => {
  const { controller, snapshots, last } = make({ get: async () => PROFILE, put: echo });
  const loading = controller.hydrate();
  assert.equal(last().status, 'loading');
  assert.equal(last().profile, null, 'nothing is invented while loading');
  assert.deepEqual(await loading, PROFILE);
  assert.equal(last().status, 'ready');
  assert.deepEqual(controller.current, PROFILE);
  assert.deepEqual(snapshots.map((s) => s.status), ['loading', 'ready']);
});

test('a new account: GET answers null -> ready with no profile (the form is needed)', async () => {
  const { controller, last } = make({ get: async () => null, put: echo });
  assert.equal(await controller.hydrate(), null);
  assert.equal(last().status, 'ready');
  assert.equal(controller.current, null);
});

test('a failed load is reported as failed, keeps nothing, and ensure() retries it', async () => {
  let fail = true;
  let gets = 0;
  const { controller, last } = make({ get: async () => { gets += 1; if (fail) throw new ApiError(0, 'NETWORK_ERROR'); return PROFILE; }, put: echo });
  assert.equal(await controller.hydrate(), null);
  assert.equal(last().status, 'failed');
  fail = false;
  assert.deepEqual(await controller.ensure(), PROFILE);
  assert.equal(last().status, 'ready');
  assert.equal(gets, 2);
});

test('loads are single-flight and ensure() reuses a ready profile', async () => {
  let gets = 0;
  const gate = deferred<SkinProfile | null>();
  const { controller } = make({ get: () => { gets += 1; return gate.promise; }, put: echo });
  const a = controller.hydrate();
  const b = controller.hydrate();
  const c = controller.ensure();
  gate.resolve(PROFILE);
  assert.deepEqual(await Promise.all([a, b, c]), [PROFILE, PROFILE, PROFILE]);
  assert.equal(gets, 1, 'three callers, one request');
  assert.deepEqual(await controller.ensure(), PROFILE);
  assert.equal(gets, 1, 'ready: no new request');
});

test('a refresh of a ready profile does not flip the app back to "loading"', async () => {
  const { controller, snapshots } = make({ get: async () => PROFILE, put: echo });
  await controller.hydrate();
  const before = snapshots.length;
  await controller.hydrate();
  assert.ok(snapshots.slice(before).every((s) => s.status === 'ready'));
});

// ================================================================== controller: save
test('save calls PUT with the profile and the backend\'s answer is the source of truth', async () => {
  const sent: SkinProfile[] = [];
  const normalised: SkinProfile = { ...PROFILE, ingredientsToAvoid: 'fragrance, alcohol' };
  const { controller, last } = make({
    get: async () => null,
    put: async (p) => { sent.push(p); return normalised; },   // backend re-formats "fragrance,alcohol"
  });
  await controller.hydrate();
  const stored = await controller.save({ ...PROFILE, ingredientsToAvoid: 'fragrance,alcohol' });
  assert.deepEqual(sent, [{ ...PROFILE, ingredientsToAvoid: 'fragrance,alcohol' }]);
  assert.deepEqual(stored, normalised);
  assert.deepEqual(controller.current, normalised, 'the app shows what the backend stored, not what was typed');
  assert.equal(last().saving, false);
});

test('first save (no profile yet) and later edit both work', async () => {
  const puts: SkinProfile[] = [];
  const { controller } = make({ get: async () => null, put: async (p) => { puts.push(p); return p; } });
  await controller.hydrate();
  assert.deepEqual(await controller.save(PROFILE), PROFILE);
  assert.deepEqual(await controller.save(OTHER), OTHER);
  assert.deepEqual(puts, [PROFILE, OTHER]);
  assert.deepEqual(controller.current, OTHER);
});

test('a failed PUT never overwrites the existing profile and releases the save lock', async () => {
  let fail = true;
  const { controller, last } = make({ get: async () => PROFILE, put: async (p) => { if (fail) throw new ApiError(0, 'NETWORK_ERROR'); return p; } });
  await controller.hydrate();
  await assert.rejects(controller.save(OTHER), (e: unknown) => e instanceof ApiError);
  assert.deepEqual(controller.current, PROFILE, 'unchanged');
  assert.equal(last().saving, false, 'the user can retry');
  assert.equal(last().status, 'ready');
  fail = false;
  assert.deepEqual(await controller.save(OTHER), OTHER, 'retry works');
});

test('a failed first save leaves the account without a profile (never a local phantom)', async () => {
  const { controller } = make({ get: async () => null, put: async () => { throw new ApiError(500, 'INTERNAL_ERROR'); } });
  await controller.hydrate();
  await assert.rejects(controller.save(PROFILE));
  assert.equal(controller.current, null);
});

test('double tap on Save: one request, the second call is ignored', async () => {
  const gate = deferred<SkinProfile>();
  let puts = 0;
  const { controller } = make({ get: async () => null, put: () => { puts += 1; return gate.promise; } });
  await controller.hydrate();
  const first = controller.save(PROFILE);
  const second = controller.save(OTHER);
  assert.equal(await second, null);
  gate.resolve(PROFILE);
  assert.deepEqual(await first, PROFILE);
  assert.equal(puts, 1);
  assert.deepEqual(controller.current, PROFILE);
});

// ================================================================== controller: sessions and races
test('logout clears the profile in memory', async () => {
  const { controller, last } = make({ get: async () => PROFILE, put: echo });
  await controller.hydrate();
  controller.reset();
  assert.equal(controller.current, null);
  assert.equal(last().status, 'idle');
  assert.equal(last().saving, false);
});

test('a slow answer from the PREVIOUS session must not overwrite the new session', async () => {
  const gateA = deferred<SkinProfile | null>();
  let call = 0;
  const { controller, last } = make({ get: () => (++call === 1 ? gateA.promise : Promise.resolve(OTHER)), put: echo });
  const userA = controller.hydrate();            // user A signs in, request is slow
  controller.reset();                            // A signs out
  const userB = controller.hydrate();            // B signs in
  assert.deepEqual(await userB, OTHER);
  gateA.resolve(PROFILE);                        // A's late answer
  await userA;
  assert.deepEqual(controller.current, OTHER, 'B keeps B\'s profile');
  assert.equal(last().status, 'ready');
});

test('a slow save from the previous session is dropped', async () => {
  const gate = deferred<SkinProfile>();
  let first = true;
  const { controller } = make({ get: async () => null, put: (p) => (first ? ((first = false), gate.promise) : Promise.resolve(p)) });
  const pending = controller.save(PROFILE);
  controller.reset();
  gate.resolve(PROFILE);
  assert.equal(await pending, null);
  assert.equal(controller.current, null);
  assert.deepEqual(await controller.save(OTHER), OTHER, 'a new session can save');
});

test('a load that started before a save must not overwrite what was saved', async () => {
  const gate = deferred<SkinProfile | null>();
  const { controller, last } = make({ get: () => gate.promise, put: echo });
  const loading = controller.hydrate();
  assert.deepEqual(await controller.save(PROFILE), PROFILE);
  gate.resolve(null);                            // the old (pre-save) answer arrives late
  await loading;
  assert.deepEqual(controller.current, PROFILE);
  assert.equal(last().status, 'ready');
});

// ================================================================== service: HTTP contract
test('GET /profile/skin: null for a new account, a typed profile otherwise', async () => {
  await tokens.storeAuthTokens({ accessToken: 'AT-1', refreshToken: 'RT-1' });
  requests.length = 0;
  fake.handler = () => profileBody(null);
  assert.equal(await profileService.getSkinProfile(), null);
  fake.handler = () => profileBody({ ...PROFILE, extraField: 'ignored' });
  assert.deepEqual(await profileService.getSkinProfile(), PROFILE, 'only the contract fields are kept');
  assert.equal(requests[0].path, '/profile/skin');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].headers.get('authorization'), 'Bearer AT-1');
});

test('malformed answers are errors, never a profile', async () => {
  const bad: unknown[] = [
    { ...PROFILE, skinType: 'greasy' },
    { ...PROFILE, sensitivity: 'very' },
    { ...PROFILE, concerns: 'acne' },
    { ...PROFILE, concerns: ['acne', 'wrinkles'] },
    { ...PROFILE, ingredientsToAvoid: 5 },
    { skinType: 'oily' },
    'profile',
    42,
  ];
  for (const profile of bad) {
    fake.handler = () => profileBody(profile);
    await assert.rejects(profileService.getSkinProfile(), (e: unknown) => e instanceof ApiError && (e as ApiError).code === 'INVALID_RESPONSE', `GET ${JSON.stringify(profile)}`);
    await assert.rejects(profileService.saveSkinProfile(PROFILE), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE', `PUT ${JSON.stringify(profile)}`);
  }
  fake.handler = () => json(200, { status: 'success', data: {} });
  await assert.rejects(profileService.getSkinProfile(), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
  fake.handler = () => json(200, { status: 'success' });
  await assert.rejects(profileService.getSkinProfile(), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
  fake.handler = () => profileBody(null);                    // a save must answer with a profile
  await assert.rejects(profileService.saveSkinProfile(PROFILE), (e: unknown) => (e as ApiError).code === 'INVALID_RESPONSE');
});

test('PUT /profile/skin: exactly the four contract fields, no duplicate concerns, returns the stored profile', async () => {
  requests.length = 0;
  fake.handler = () => profileBody({ ...PROFILE, ingredientsToAvoid: 'fragrance, alcohol' });
  const stored = await profileService.saveSkinProfile({ ...PROFILE, concerns: ['acne', 'redness', 'acne'], ingredientsToAvoid: 'fragrance,alcohol', ...({ junk: 1 } as object) } as SkinProfile);
  assert.equal(requests[0].method, 'PUT');
  assert.equal(requests[0].path, '/profile/skin');
  assert.equal(requests[0].headers.get('content-type'), 'application/json');
  assert.deepEqual(requests[0].body, { skinType: 'combination', sensitivity: 'sensitive', concerns: ['acne', 'redness'], ingredientsToAvoid: 'fragrance,alcohol' });
  assert.deepEqual(stored, PROFILE);
});

test('HTTP failures on PUT surface as ApiError (400 / 401 / 500 / network)', async () => {
  for (const [status, code] of [[400, 'VALIDATION_ERROR'], [500, 'INTERNAL_ERROR']] as const) {
    fake.handler = () => json(status, { status: 'failed', error: { code } });
    await assert.rejects(profileService.saveSkinProfile(PROFILE), (e: unknown) => (e as ApiError).code === code && (e as ApiError).statusCode === status);
  }
  fake.handler = () => { throw new TypeError('Network request failed'); };
  await assert.rejects(profileService.saveSkinProfile(PROFILE), (e: unknown) => (e as ApiError).code === 'NETWORK_ERROR');
});

// ================================================================== auth: no hard-coded profile any more
test('sign-in / sign-up / restore sessions carry NO skinProfile field', async () => {
  const authBody = json(200, { status: 'success', data: { user: { id: 'u1', email: 'a@b.test', displayName: 'A' }, accessToken: 'AT-2', refreshToken: 'RT-2', accessTokenExpiresIn: 900 } });
  fake.handler = (url) => (url.endsWith('/auth/me') ? json(200, { status: 'success', data: { user: { id: 'u1', email: 'a@b.test', displayName: 'A' } } }) : authBody.clone());
  const sessions = [
    await auth.authService.signInWithEmail('a@b.test', 'password-1234'),
    await auth.authService.signUpWithEmail('a@b.test', 'password-1234'),
    await auth.authService.signInWithGoogle('GOOGLE.ID.TOKEN'),
    await auth.authService.restoreSession(),
  ];
  for (const s of sessions) {
    assert.ok(s);
    assert.ok(!('skinProfile' in (s as object)), 'AuthSession must not pretend to know the profile');
    assert.deepEqual(Object.keys(s as object).sort(), ['user']);   // history is loaded from the backend now
  }
});

// ================================================================== scan: the snapshot that is sent
test('POST /scans sends the hydrated profile as the snapshot (and nothing when there is none)', async () => {
  const { controller } = make({ get: async () => PROFILE, put: echo });
  await controller.hydrate();
  fake.handler = () => json(200, { status: 'success', result: { id: 's1', detectionAreas: [] } });
  requests.length = 0;
  await scanService.analyzePhoto('file:///photo.jpg', controller.current, false);   // what analyzing.tsx does
  assert.deepEqual(JSON.parse(String(requests[0].form!.get('skinProfile'))), PROFILE);
  controller.reset();
  requests.length = 0;
  await scanService.analyzePhoto('file:///photo.jpg', controller.current, false);
  assert.equal(requests[0].form!.get('skinProfile'), null, 'no profile -> no field');
});

// ================================================================== profile + consent after login, expired token
test('profile and consent hydrate together after login without racing (one refresh, both succeed)', async () => {
  await tokens.storeAuthTokens({ accessToken: 'OLD', refreshToken: 'RT-OLD' });
  requests.length = 0;
  let refreshes = 0;
  fake.handler = (url, init) => {
    const bearer = new Headers(init.headers).get('authorization');
    if (url.endsWith('/auth/refresh')) { refreshes += 1; return json(200, { status: 'success', data: { accessToken: 'NEW', refreshToken: 'RT-NEW' } }); }
    if (bearer !== 'Bearer NEW') return json(401, { status: 'failed', error: { code: 'UNAUTHORIZED' } });
    if (url.endsWith('/profile/skin')) return profileBody(PROFILE);
    if (url.endsWith('/consents/ai-training')) return json(200, { status: 'success', data: { granted: true } });
    throw new Error('unexpected ' + url);
  };
  const profile = new ProfileController({ get: () => profileService.getSkinProfile(), put: (p) => profileService.saveSkinProfile(p) }, () => {});
  const consent = new ConsentController({ get: () => consentService.getAiTraining(), put: (g) => consentService.setAiTraining(g) }, () => {});
  await Promise.all([profile.hydrate(), consent.hydrate()]);
  assert.deepEqual(profile.current, PROFILE);
  assert.equal(consent.current, true);
  assert.equal(refreshes, 1, 'the two requests share ONE refresh');
});
