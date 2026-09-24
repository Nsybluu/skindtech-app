import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';

import {
  resolveLetterSpacing,
  resolveLineHeight,
  TextVariants,
  type TextVariantSpec,
} from '../src/constants/text-variants.ts';

/** The agreed scale: role → [font size, line height, weight]. A change here is a design decision. */
const SCALE: Record<string, [number, number, string]> = {
  display: [36, 46, 'bold'],
  authTitle: [30, 40, 'bold'],
  greeting: [26, 36, 'bold'],
  screenTitle: [24, 34, 'bold'],
  headline: [20, 30, 'bold'],
  sectionTitle: [18, 27, 'semibold'],
  cardTitle: [16, 24, 'semibold'],
  titleSmall: [15, 23, 'semibold'],
  bodyLarge: [16, 25, 'regular'],
  body: [15, 23, 'regular'],
  bodySmall: [14, 21, 'regular'],
  label: [14, 21, 'semibold'],
  caption: [13, 20, 'regular'],
  captionSemibold: [13, 20, 'semibold'],
  footnote: [12, 18, 'regular'],
  footnoteSemibold: [12, 18, 'semibold'],
  micro: [11, 16, 'regular'],
  buttonLarge: [16, 24, 'semibold'],
  button: [15, 22, 'semibold'],
  // Deliberate exceptions, documented in text-variants.ts:
  brand: [14, 20, 'medium'],
  avatarLetter: [24, 30, 'semibold'],
};

const variants = TextVariants as Record<string, TextVariantSpec>;

describe('text scale', () => {
  it('has exactly the agreed roles, sizes, line heights and weights', () => {
    assert.deepEqual(Object.keys(variants).sort(), Object.keys(SCALE).sort());
    for (const [name, [fontSize, lineHeight, weight]] of Object.entries(SCALE)) {
      const spec = variants[name]!;
      assert.equal(spec.fontSize, fontSize, `${name} font size`);
      assert.equal(spec.lineHeight, lineHeight, `${name} line height`);
      assert.equal(spec.weight, weight, `${name} weight`);
    }
  });

  it('no longer has the duplicated roles that made screens disagree', () => {
    for (const removed of ['title', 'titleLarge', 'subtitle', 'listStep', 'cardHeadline', 'sheetTitle', 'screenTitleSmall']) {
      assert.equal(removed in variants, false, `${removed} was merged into another role`);
    }
  });

  it('keeps the hierarchy: bigger roles are never smaller than the ones under them', () => {
    const order = ['display', 'authTitle', 'greeting', 'screenTitle', 'headline', 'sectionTitle', 'cardTitle', 'titleSmall', 'bodySmall', 'caption', 'footnote', 'micro'];
    for (let index = 1; index < order.length; index += 1) {
      assert.ok(variants[order[index - 1]!]!.fontSize > variants[order[index]!]!.fontSize, `${order[index - 1]} > ${order[index]}`);
    }
    assert.ok(variants.buttonLarge!.fontSize > variants.button!.fontSize);
    assert.equal(variants.body!.fontSize, variants.button!.fontSize, 'a button reads at body size');
    assert.equal(variants.bodyLarge!.fontSize, variants.buttonLarge!.fontSize);
  });

  it('gives every role a comfortable line height', () => {
    for (const [name, spec] of Object.entries(variants)) {
      assert.ok(spec.lineHeight >= spec.fontSize * 1.25, `${name}: ${spec.lineHeight} is too tight for ${spec.fontSize}`);
      assert.ok(spec.lineHeight <= spec.fontSize * 1.6, `${name}: ${spec.lineHeight} is too loose for ${spec.fontSize}`);
    }
  });
});

describe('Thai and English text', () => {
  it('leaves English line heights and tracking as designed', () => {
    for (const spec of Object.values(variants)) {
      assert.equal(resolveLineHeight(spec, false), spec.lineHeight);
      assert.equal(resolveLetterSpacing(spec, false), spec.letterSpacing ?? 0);
    }
  });

  it('gives Thai enough room for stacked vowels and tone marks', () => {
    for (const [name, spec] of Object.entries(variants)) {
      const thai = resolveLineHeight(spec, true);
      assert.ok(thai >= spec.lineHeight, `${name}: Thai is never tighter than English`);
      assert.ok(thai >= spec.fontSize * (spec.fontSize >= 24 ? 1.4 : 1.5) - 0.001, `${name}: Thai line height ${thai}`);
    }
    // The screen title, the one every screen shares, lands in the 34-36 band the design asks for.
    const title = resolveLineHeight(variants.screenTitle!, true);
    assert.ok(title >= 34 && title <= 36, `screenTitle in Thai is ${title}`);
  });

  it('never applies negative letter spacing to Thai', () => {
    for (const [name, spec] of Object.entries(variants)) {
      assert.ok(resolveLetterSpacing(spec, true) >= 0, `${name} tracking in Thai`);
    }
    assert.ok(variants.display!.letterSpacing! < 0, 'the latin display keeps its tight tracking');
  });
});

// ------------------------------------------------------------------ source rules
const SRC = join(import.meta.dirname, '..', 'src');
const files: string[] = [];
(function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
})(SRC);
const rel = (file: string) => relative(SRC, file).split(sep).join('/');
const source = (file: string) => readFileSync(file, 'utf8');

/** Files that define the scale itself. Everything else must use a variant. */
const TYPOGRAPHY_FILES = new Set(['constants/text-variants.ts', 'constants/typography.ts', 'components/ui/app-text.tsx']);

describe('typography source rules', () => {
  it('never hardcodes font size, line height, weight, family or tracking outside the scale', () => {
    const offenders = files
      .filter((file) => !TYPOGRAPHY_FILES.has(rel(file)))
      .filter((file) => /\b(fontSize|lineHeight|fontWeight|fontFamily|letterSpacing)\b/.test(source(file)))
      .map(rel);
    assert.deepEqual(offenders, []);
  });

  it('never shrinks text to fit (`adjustsFontSizeToFit`): layouts wrap instead', () => {
    const offenders = files.filter((file) => /adjustsFontSizeToFit|minimumFontScale/.test(source(file))).map(rel);
    assert.deepEqual(offenders, []);
  });

  it('draws every piece of text through AppText, never the bare React Native <Text>', () => {
    const offenders = files
      .filter((file) => rel(file) !== 'components/ui/app-text.tsx')
      .filter((file) => /import\s*\{[^}]*\bText\b[^}]*\}\s*from\s*'react-native'/.test(source(file)))
      .map(rel);
    assert.deepEqual(offenders, []);
  });

  it('caps Dynamic Type growth on every text input', () => {
    const offenders = files
      .filter((file) => /<TextInput\b/.test(source(file)) && !/maxFontSizeMultiplier=/.test(source(file)))
      .map(rel);
    assert.deepEqual(offenders, []);
  });

  it('only puts existing variants on AppText', () => {
    const known = new Set(Object.keys(variants));
    const unknown: string[] = [];
    for (const file of files) {
      for (const match of source(file).matchAll(/<AppText\b[^>]*?\bvariant="([A-Za-z]+)"/gs)) {
        if (!known.has(match[1]!)) unknown.push(`${rel(file)}: ${match[1]}`);
      }
    }
    assert.deepEqual(unknown, []);
  });
});
