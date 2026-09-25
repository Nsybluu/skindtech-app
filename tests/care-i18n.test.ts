import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';

import { en } from '@/i18n/en';
import { th } from '@/i18n/th';
import { demoCareContent } from '@/mocks/care';
import {
  CARE_BASICS,
  CARE_DISCLAIMERS,
  CARE_HABITS,
  CARE_STEPS,
  PROFESSIONAL_HELP_REASONS,
} from '@/types/recommendation';
import { SKIN_CONCERNS, SKIN_SENSITIVITIES, SKIN_TYPES } from '@/types/profile';

const languages = { en, th } as const;

/** [name, the semantic keys the backend may send, where the wording lives] */
const KEYED: [string, readonly string[], (t: typeof en) => Record<string, string>][] = [
  ['care.step', CARE_STEPS, (t) => t.care.step],
  ['care.basic', CARE_BASICS, (t) => t.care.basic],
  ['care.habit', CARE_HABITS, (t) => t.care.habit],
  ['care.professionalReason', PROFESSIONAL_HELP_REASONS, (t) => t.care.professionalReason],
  ['care.disclaimer', CARE_DISCLAIMERS, (t) => t.care.disclaimer],
];

describe('semantic key -> wording (EN and TH)', () => {
  for (const [name, keys, pick] of KEYED) {
    for (const [code, t] of Object.entries(languages)) {
      it(`${name} has a real sentence for every key in ${code}, and nothing extra`, () => {
        const table = pick(t as typeof en);
        assert.deepEqual(Object.keys(table).sort(), [...keys].sort());
        for (const key of keys) {
          const text = table[key]!;
          assert.equal(typeof text, 'string');
          assert.ok(text.trim().length > 3, `${name}.${key} (${code}) is empty`);
          assert.notEqual(text, key, `${name}.${key} (${code}) shows the raw key`);
          assert.ok(!text.includes('_'), `${name}.${key} (${code}) looks like a raw key: ${text}`);
        }
      });
    }
  }

  it('the two languages say different things (a Thai string is not the English one pasted)', () => {
    for (const [, keys, pick] of KEYED) {
      for (const key of keys) assert.notEqual(pick(en)[key], pick(th)[key], key);
    }
  });

  it('every profile enum shown on the snapshot card has wording in both languages', () => {
    for (const t of [en, th]) {
      for (const type of SKIN_TYPES) assert.ok(t.skinProfileSummary.skinTypeLong[type]);
      for (const sensitivity of SKIN_SENSITIVITIES) assert.ok(t.skinProfileSummary.sensitivity[sensitivity]);
      for (const concern of SKIN_CONCERNS) assert.ok(t.skinProfile.concernOptions[concern]);
    }
  });

  it('EN and TH have exactly the same structure (every key, function and list)', () => {
    const shape = (value: unknown, path: string, out: string[]): string[] => {
      if (typeof value === 'function') out.push(`${path}()`);
      else if (Array.isArray(value)) out.push(`${path}[${value.length}]`);
      else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) shape(child, `${path}.${key}`, out);
      } else out.push(path);
      return out;
    };
    assert.deepEqual(shape(th, 'th', []).map((p) => p.slice(2)), shape(en, 'en', []).map((p) => p.slice(2)));
  });

  it('the snapshot and care copy needed by the result screen exists in both languages', () => {
    for (const t of [en, th]) {
      for (const text of [
        t.result.skinProfileUsed,
        t.result.snapshotNone,
        t.result.snapshotNote,
        t.result.currentProfile,
        t.result.currentProfileHint,
        t.care.personalizedTitle,
        t.care.professionalTitle,
        t.care.professionalBody,
        t.care.professionalRecommendedTitle,
        t.care.professionalRecommendedBody,
        t.care.loading,
        t.care.loadFailedTitle,
        t.care.notFoundTitle,
        t.care.notFoundBody,
        t.care.demoNotice,
        t.common.retry,
      ]) {
        assert.ok(text.trim().length > 3);
      }
      assert.ok(t.result.snapshotConcerns('X').includes('X'));
      assert.ok(t.result.snapshotAvoid('X').includes('X'));
    }
    assert.match(en.care.personalizedTitle, /Personalized guidance/);
    assert.match(th.care.personalizedTitle, /คำแนะนำเพิ่มเติมสำหรับคุณ/);
  });

  it('the current-profile link says "current" in both languages, so it cannot pass for the scan\'s own profile', () => {
    assert.match(en.result.currentProfile, /current/i);
    assert.match(th.result.currentProfile, /ปัจจุบัน/);
  });

  it('the professional-help wording is polite: no diagnosis, treatment or medication in either language', () => {
    const texts = [
      ...Object.values(en.care.professionalReason), en.care.professionalRecommendedTitle, en.care.professionalRecommendedBody,
      ...Object.values(th.care.professionalReason), th.care.professionalRecommendedTitle, th.care.professionalRecommendedBody,
    ];
    for (const text of texts) assert.doesNotMatch(text, /diagnos|prescri|medicat|antibiotic|วินิจฉัย(?!หรือ)|ยาปฏิชีวนะ|สั่งยา/i, text);
  });

  it('demo guidance is built from the same semantic keys, so it is translated like real guidance', () => {
    for (const step of [...demoCareContent.morningSteps, ...demoCareContent.eveningSteps]) assert.ok((CARE_STEPS as readonly string[]).includes(step));
    for (const basic of demoCareContent.basics) assert.ok((CARE_BASICS as readonly string[]).includes(basic));
    for (const habit of demoCareContent.habits) assert.ok((CARE_HABITS as readonly string[]).includes(habit));
  });
});

// ------------------------------------------------------------------ the components hold no advice of their own
const SRC = join(import.meta.dirname, '..', 'src');
const read = (relativePath: string) => readFileSync(join(SRC, relativePath), 'utf8');
const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

describe('care and snapshot components', () => {
  it('draw text only from i18n or from the data they are given — no sentences hard-coded in JSX', () => {
    const files = ['components/care/care-guidance.tsx', 'components/care/care-section.tsx', 'components/care/skincare-basics.tsx', 'components/result/skin-profile-snapshot-card.tsx'];
    for (const file of files) {
      const source = read(file);
      const literals = [...source.matchAll(/>\s*([A-Za-z฀-๿][^<>{}\n]{6,})\s*</g)].map((match) => match[1]);
      assert.deepEqual(literals, [], `${file} has hard-coded text`);
    }
  });

  it('the result screen shows the scan\'s own snapshot and never reads the current profile', () => {
    const screen = read('app/scan-result.tsx');
    assert.match(screen, /result\.skinProfileSnapshot/);
    // The current profile lives in `useUserData().skinProfile`; the result screen must not take it.
    assert.doesNotMatch(screen, /\bskinProfile\b\s*[,}=]/, 'scan-result must not read the current skinProfile');
    assert.doesNotMatch(screen, /getSkinProfile|ensureSkinProfile/);
    const card = read('components/result/skin-profile-snapshot-card.tsx');
    assert.doesNotMatch(card, /useUserData|getSkinProfile/, 'the snapshot card only draws what it is given');
  });

  it('no screen outside the scan flow shows the current profile as "used for this scan"', () => {
    const offenders = listFiles(SRC)
      .filter((file) => /\.tsx?$/.test(file))
      .filter((file) => /result\.skinProfileUsed|t\.result\.skinProfileUsed/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(SRC, file).split(sep).join('/'));
    assert.deepEqual(offenders, ['components/result/skin-profile-snapshot-card.tsx']);
  });

  it('the old static advice is gone: no morningSteps/eveningSteps/habitsBody strings remain in i18n', () => {
    for (const t of [en, th] as unknown as Record<string, Record<string, unknown>>[]) {
      for (const key of ['morningSteps', 'eveningSteps', 'habitsBody', 'basicCleanser', 'basicMoisturizer', 'basicSunscreen']) {
        assert.equal(key in t.care!, false, key);
      }
    }
  });
});
