import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';

import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import tailwind from 'tailwindcss';
import ts from 'typescript';

import { Colors } from '../src/constants/colors.ts';
import { Radius } from '../src/constants/spacing.ts';
import { FontFamily, TextVariants } from '../src/constants/text-variants.ts';
import { cn } from '../src/utils/cn.ts';
import { COLOR_GROUPS, buildTailwindTheme } from '../scripts/tailwind-theme.ts';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const require = createRequire(import.meta.url);

const files: string[] = [];
(function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
  }
})(SRC);
const rel = (file: string) => relative(SRC, file).split(sep).join('/');
const text = (file: string) => readFileSync(file, 'utf8');
const parse = (file: string) => ts.createSourceFile(file, text(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

// ------------------------------------------------------------------------- class extraction
/** A name that holds Tailwind classes: `className`, `iconClassName`, `BAR_CLASS`, `borderClass`... */
const isClassName = (name: string) => /(^className$|ClassName$|Class$|Classes$|_CLASS$)/.test(name);

/** Tokens of one string, minus the pieces that touch a `${}` (they are only part of a class). */
function tokensOf(piece: string, partialStart: boolean, partialEnd: boolean): string[] {
  const tokens = piece.split(/\s+/).filter(Boolean);
  if (partialStart && tokens.length > 0 && !/^\s/.test(piece)) tokens.shift();
  if (partialEnd && tokens.length > 0 && !/\s$/.test(piece)) tokens.pop();
  return tokens;
}

const DYNAMIC_CLASS_FILE = 'components/ui/app-text.tsx';
/** Registers `className` → `style` for third-party components; its `'style'` is not a class. */
const NO_CLASSES_FILE = 'components/ui/styled.ts';

/** Every Tailwind class written as a string in the source, and where. */
function collectClasses(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const add = (token: string, file: string) => found.set(token, [...(found.get(token) ?? []), file]);

  for (const file of files) {
    if (rel(file) === NO_CLASSES_FILE) continue;
    const source = parse(file);
    const visitStrings = (root: ts.Node) => {
      const walk = (node: ts.Node) => {
        // `variant === 'gradient'` compares strings; only the branches of `a ? 'x' : 'y'` are classes.
        if (ts.isBinaryExpression(node) && /^(===|!==|==|!=)$/.test(node.operatorToken.getText())) return;
        if (ts.isConditionalExpression(node)) {
          walk(node.whenTrue);
          walk(node.whenFalse);
          return;
        }
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          for (const token of tokensOf(node.text, false, false)) add(token, rel(file));
        } else if (ts.isTemplateExpression(node)) {
          // AppText builds `text-${variant}` on purpose; those names are safelisted in tailwind.config.js.
          if (rel(file) === DYNAMIC_CLASS_FILE) return;
          for (const token of tokensOf(node.head.text, false, true)) add(token, rel(file));
          node.templateSpans.forEach((span, index) => {
            const last = index === node.templateSpans.length - 1;
            for (const token of tokensOf(span.literal.text, true, !last)) add(token, rel(file));
          });
        }
        ts.forEachChild(node, walk);
      };
      walk(root);
    };

    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && isClassName(node.name.getText()) && node.initializer) {
        visitStrings(node.initializer);
        return;
      }
      if (ts.isCallExpression(node) && node.expression.getText() === 'cn') {
        node.arguments.forEach(visitStrings);
        return;
      }
      if ((ts.isVariableDeclaration(node) || ts.isPropertyAssignment(node) || ts.isParameter(node) || ts.isBindingElement(node)) && node.name && isClassName(node.name.getText())) {
        const initializer = ts.isBindingElement(node) || ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyAssignment(node) ? node.initializer : undefined;
        if (initializer) {
          visitStrings(initializer);
          return;
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}

const classes = collectClasses();

describe('NativeWind migration', () => {
  it('finds the classes (sanity check of the scanner itself)', () => {
    assert.ok(classes.size > 300, `only ${classes.size} classes found`);
    assert.ok(classes.has('bg-surface-card'));
    assert.ok(classes.has('active:opacity-70'));
    assert.ok(!classes.has('text-'), 'a half-built `text-${variant}` must not be reported');
  });

  it('has no StyleSheet left: every style is a class, an Effect or a runtime value', () => {
    const offenders = files.filter((file) => /\bStyleSheet\b/.test(text(file))).map(rel);
    assert.deepEqual(offenders, []);
  });

  it('keeps the Tailwind theme in step with the design tokens (run `npm run theme`)', () => {
    const committed = JSON.parse(readFileSync(join(ROOT, 'tailwind.theme.json'), 'utf8'));
    assert.deepEqual(committed, JSON.parse(JSON.stringify(buildTailwindTheme())));
  });

  it('gives every colour token a class, with the same value', () => {
    const theme = buildTailwindTheme();
    for (const [group, prefix] of Object.entries(COLOR_GROUPS)) {
      const tokens = Colors[group as keyof typeof Colors] as Record<string, string>;
      const generated = (theme.colors as Record<string, Record<string, string>>)[prefix]!;
      assert.equal(Object.keys(generated).length, Object.keys(tokens).length, `${group} → ${prefix}`);
      assert.deepEqual(Object.values(generated), Object.values(tokens), `${group} → ${prefix} values`);
    }
  });

  it('maps the radius tokens and the type scale onto classes', () => {
    const theme = buildTailwindTheme();
    assert.equal(theme.borderRadius.pill, `${Radius.pill}px`);
    assert.equal(theme.borderRadius.sheet, `${Radius.sheet}px`);
    for (const [weight, family] of Object.entries(FontFamily)) assert.deepEqual(theme.fontFamily[`noto-${weight}`], [family]);
    for (const name of Object.keys(TextVariants)) {
      const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      assert.ok(kebab in theme.fontSize, `text-${kebab}`);
      assert.ok(`${kebab}-th` in theme.fontSize, `text-${kebab}-th`);
    }
  });

  it('only uses classes that Tailwind can generate (an unknown class fails silently on a phone)', async () => {
    const config = require('../tailwind.config.js');
    const tokens = [...classes.keys()];
    const result = await postcss([
      tailwind({ ...config, safelist: [], content: [{ raw: tokens.join(' '), extension: 'html' }] }),
    ]).process('@tailwind utilities;', { from: undefined });

    const generated = new Set<string>();
    result.root.walkRules((rule) => {
      selectorParser((selectors) => selectors.walkClasses((node) => {
          generated.add(node.value);
        })).processSync(rule.selector);
    });

    const unknown = tokens.filter((token) => !generated.has(token)).map((token) => `${token}  (${classes.get(token)![0]})`);
    assert.deepEqual(unknown, []);
  });

  it('lets a caller replace a default class (tailwind-merge knows the project names)', () => {
    assert.equal(cn('bg-surface-card rounded-lg', 'bg-brand-primary'), 'rounded-lg bg-brand-primary');
    // a text SIZE must not be mistaken for a colour, and the other way round
    assert.equal(cn('text-body text-fg-primary', 'text-fg-muted'), 'text-body text-fg-muted');
    assert.equal(cn('text-body text-fg-primary', 'text-caption'), 'text-fg-primary text-caption');
    assert.equal(cn('text-body-th text-fg-primary', 'text-center'), 'text-body-th text-fg-primary text-center');
    assert.equal(cn('rounded-lg', 'rounded-pill'), 'rounded-pill');
    assert.equal(cn('h-14 px-1', 'h-11 px-5'), 'h-11 px-5');
    assert.equal(cn('border-line-card border', 'border-rose/[0.6]'), 'border border-rose/[0.6]');
    assert.equal(cn('font-noto-regular', 'font-noto-bold'), 'font-noto-bold');
  });

  it('never builds a class name from a variable the scanner cannot see', () => {
    // `bg-${x}` is invisible to Tailwind. Only AppText may do it (its names are safelisted).
    const offenders: string[] = [];
    for (const file of files) {
      if (rel(file) === 'components/ui/app-text.tsx') continue;
      for (const match of text(file).matchAll(/className=\{?`[^`]*\$\{[^`]*`/g)) {
        if (/[a-z]-\$\{/.test(match[0])) offenders.push(`${rel(file)}: ${match[0].slice(0, 60)}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('draws React Native and third-party components that need a className mapping only through styled.ts', () => {
    const offenders: string[] = [];
    for (const file of files) {
      if (rel(file) === 'components/ui/styled.ts') continue;
      const source = text(file);
      if (/from 'expo-image'|from 'expo-camera'.*CameraView|import \{[^}]*\bCameraView\b[^}]*\} from 'expo-camera'|import \{[^}]*\bGlassView\b[^}]*\} from 'expo-glass-effect'|import Svg\b[^;]*from 'react-native-svg'/.test(source)) {
        offenders.push(rel(file));
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('has no function-style Pressable `style` (NativeWind drops it): use `active:` classes', () => {
    const offenders = files.filter((file) => /style=\{\s*\(\s*(\{|\w+\s*\))\s*=>/.test(text(file))).map(rel);
    assert.deepEqual(offenders, []);
  });

  it('keeps type out of className except through the scale', () => {
    const allowedFont = new Set(['components/ui/app-text.tsx']);
    const offenders: string[] = [];
    for (const [token, where] of classes) {
      const bare = token.split(':').pop()!;
      if (/^(leading|tracking)-/.test(bare)) offenders.push(`${token} (${where[0]})`);
      if (/^text-\[\d/.test(bare)) offenders.push(`${token} (${where[0]})`);
      if (/^font-/.test(bare) && !where.every((file) => allowedFont.has(file) || /^font-noto-/.test(bare))) offenders.push(`${token} (${where[0]})`);
      if (/^text-(xs|sm|base|lg|xl|[2-9]xl)$/.test(bare)) offenders.push(`${token} (${where[0]})`);
    }
    assert.deepEqual(offenders, []);
  });

  it('keeps hard-coded colours out of className except the few documented ones', () => {
    // A colour is a token (`bg-surface-card`) or a base hue with opacity (`bg-rose/[0.12]`). These
    // arbitrary values are Figma one-offs that have no token.
    const ARBITRARY_COLOURS = new Set([
      'bg-[rgba(255,253,252,0.99)]', // sheets with a text field / consent (near-opaque sheet)
      'bg-[rgba(253,235,235,0.58)]', // AI consent benefit card
      'bg-[rgba(255,249,247,0.92)]', // Profile "Skin and results" group
      'bg-[rgba(201,181,174,0.8)]', // bottom-sheet grab handle
    ]);
    const offenders = [...classes.keys()].filter((token) => /\[(#|rgba?\()/.test(token) && !ARBITRARY_COLOURS.has(token));
    assert.deepEqual(offenders, []);
  });
});

// ----------------------------------------------------------------------------- inline styles
/**
 * Everything that is NOT a class: a `style` (or `contentContainerStyle`) prop. Allowed:
 *  - an `Effects.*` value (gradient / shadow, which a v4 class cannot draw like React Native does);
 *  - the few runtime values below, each with the reason it cannot be a class.
 */
const RUNTIME_STYLES: Record<string, { count: number; why: string }> = {
  'components/ui/app-text.tsx': { count: 1, why: 'Android-only includeFontPadding, plus a caller-supplied style' },
  'components/ui/app-button.tsx': { count: 1, why: 'gradient / Google shadow picked by variant (Effects)' },
  'components/ui/action-bar.tsx': { count: 1, why: 'bottom padding follows the safe area; the shadow is an Effect' },
  'components/ui/screen-background.tsx': { count: 1, why: 'the gradient is an Effect; a caller may add a style' },
  'components/ui/app-screen.tsx': { count: 2, why: 'top / bottom padding follow the safe area' },
  'components/ui/bottom-sheet.tsx': { count: 1, why: 'bottom padding follows the safe area; passes an Effects shadow through' },
  'components/ui/toggle.tsx': { count: 1, why: 'Reanimated animated style' },
  'components/scan/analysis-progress-card.tsx': { count: 1, why: 'Reanimated animated width' },
  'components/scan/scan-flow-layout.tsx': { count: 2, why: 'top / bottom padding follow the safe area' },
  'components/result/detected-areas-card.tsx': { count: 1, why: 'aspect ratio of the photo is known only at run time' },
  'components/ai-chat/chat-composer.tsx': { count: 1, why: 'bottom padding depends on the keyboard and the tab bar' },
  'components/profile/option-chips.tsx': { count: 1, why: 'flex-grow comes from the data (Figma chip widths)' },
  'components/auth/auth-layout.tsx': { count: 1, why: 'top / bottom padding follow the safe area' },
  'components/navigation/skin-tab-bar.tsx': { count: 6, why: 'halo position is measured; tab bar offset follows the safe area; the shadow of the tone in use (an Effect)' },
  'app/(tabs)/index.tsx': { count: 1, why: 'top padding follows the status bar' },
  'app/(tabs)/account.tsx': { count: 1, why: 'top padding follows the status bar' },
  'app/(tabs)/ai-chat.tsx': { count: 1, why: 'top padding follows the status bar' },
  'app/(auth)/welcome.tsx': { count: 1, why: 'top / bottom padding follow the safe area' },
};

describe('inline styles', () => {
  const styleProps = new Map<string, string[]>();
  for (const file of files) {
    const source = parse(file);
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && /^(style|contentContainerStyle|columnWrapperStyle|containerStyle)$/.test(node.name.getText()) && node.initializer && ts.isJsxExpression(node.initializer)) {
        const expression = node.initializer.getText().replace(/\s+/g, ' ');
        if (!/^\{\s*(Effects\.\w+|\[\s*Effects\.\w+\s*\])\s*\}$/.test(expression)) {
          styleProps.set(rel(file), [...(styleProps.get(rel(file)) ?? []), expression]);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  it('are limited to Effects and the documented runtime values', () => {
    const unexpected: string[] = [];
    for (const [file, expressions] of styleProps) {
      const allowed = RUNTIME_STYLES[file]?.count ?? 0;
      if (expressions.length > allowed) unexpected.push(`${file}: ${expressions.length} inline styles, ${allowed} allowed → ${expressions.join(' | ')}`);
    }
    assert.deepEqual(unexpected, []);
  });

  it('has no stale entries in the list of allowed runtime values', () => {
    const stale = Object.entries(RUNTIME_STYLES)
      .filter(([file, { count }]) => (styleProps.get(file)?.length ?? 0) !== count)
      .map(([file, { count }]) => `${file}: expected ${count}, found ${styleProps.get(file)?.length ?? 0}`);
    assert.deepEqual(stale, []);
  });
});
