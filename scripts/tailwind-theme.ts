/**
 * Builds the Tailwind theme from the design tokens in `src/constants`, so a class name such as
 * `bg-surface-card` or `text-body` always means exactly what the TypeScript token says. The
 * tokens stay the single source of truth; `tailwind.theme.json` is generated from them
 * (`npm run theme`) and tests/tailwind-theme.test.ts fails when the two drift apart.
 *
 * Pure data, no React Native imports: it runs under plain Node (see package.json `theme`).
 */
import { Alpha, Colors } from '../src/constants/colors.ts';
import { Radius } from '../src/constants/spacing.ts';
import {
  FontFamily,
  kebabCase as kebab,
  resolveLetterSpacing,
  resolveLineHeight,
  TextVariants,
  type TextVariantSpec,
} from '../src/constants/text-variants.ts';

/** Token groups that become colour classes: `Colors.<group>.<name>` → `<prefix>-<name>`. */
export const COLOR_GROUPS = {
  /** `text-fg-primary` */
  text: 'fg',
  brand: 'brand',
  icon: 'icon',
  /** `bg-canvas-sheet` */
  background: 'canvas',
  /** `border-line-card` */
  border: 'line',
  surface: 'surface',
  success: 'success',
  progress: 'progress',
  error: 'error',
  danger: 'danger',
  history: 'history',
} as const satisfies Record<keyof typeof Colors, string>;

/** Base hues that are used at many different opacities: `bg-rose/[0.12]`, `border-taupe/[0.28]`. */
const hueChannels = (hue: keyof typeof Alpha) => Alpha[hue](1).match(/\d+(?=[,)])/g)!.slice(0, 3).join(' ');

function colors() {
  const out: Record<string, string | Record<string, string>> = {
    transparent: 'transparent',
  };
  for (const hue of Object.keys(Alpha) as (keyof typeof Alpha)[]) out[hue] = `rgb(${hueChannels(hue)} / <alpha-value>)`;
  for (const [group, prefix] of Object.entries(COLOR_GROUPS)) {
    const tokens = Colors[group as keyof typeof Colors] as Record<string, string>;
    out[prefix] = Object.fromEntries(Object.entries(tokens).map(([name, value]) => [kebab(name), value]));
  }
  return out;
}

/** `text-<role>` sets size, line height and tracking; `text-<role>-th` is the same role for Thai. */
function fontSize() {
  const entry = (spec: TextVariantSpec, thai: boolean) => {
    // Always set, even to 0: React Native on iOS turns kerning off for text that has a letter spacing,
    // and the app has always rendered its text that way, so a missing value would change every glyph.
    const options = {
      lineHeight: `${resolveLineHeight(spec, thai)}px`,
      letterSpacing: `${resolveLetterSpacing(spec, thai)}px`,
    };
    return [`${spec.fontSize}px`, options] as const;
  };
  const out: Record<string, readonly [string, Record<string, string>] | string> = {};
  for (const [name, spec] of Object.entries(TextVariants) as [string, TextVariantSpec][]) {
    out[kebab(name)] = entry(spec, false);
    out[`${kebab(name)}-th`] = entry(spec, true);
  }
  // TextInput: size only (a fixed line height pushes single-line text off-centre on iOS).
  out.field = `${TextVariants.bodyLarge.fontSize}px`;
  out['field-multiline'] = [`${TextVariants.bodyLarge.fontSize}px`, { lineHeight: `${TextVariants.bodyLarge.lineHeight}px` }];
  return out;
}

export function buildTailwindTheme() {
  return {
    colors: colors(),
    borderRadius: {
      none: '0px',
      sm: `${Radius.s}px`,
      md: `${Radius.m}px`,
      lg: `${Radius.l}px`,
      xl: `${Radius.xl}px`,
      '2xl': `${Radius.xxl}px`,
      sheet: `${Radius.sheet}px`,
      pill: `${Radius.pill}px`,
      full: '9999px',
    },
    fontFamily: Object.fromEntries(Object.entries(FontFamily).map(([weight, family]) => [`noto-${weight}`, [family]])),
    fontSize: fontSize(),
  };
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  const { writeFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const target = join(import.meta.dirname, '..', 'tailwind.theme.json');
  writeFileSync(target, `${JSON.stringify(buildTailwindTheme(), null, 2)}\n`);
  console.log(`wrote ${target}`);
}
