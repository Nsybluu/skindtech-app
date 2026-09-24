/**
 * Typography scale — pure data, no React Native or asset imports, so it can be unit tested
 * (see tests/typography.test.ts) and shared by AppText and the text inputs.
 *
 * Figma uses Noto Sans Thai at the SemiCondensed width (wdth 87.5). React Native cannot drive
 * variable-font axes, so static SemiCondensed instances are bundled in assets/fonts and each
 * weight is its own family (see typography.ts).
 *
 * One scale for the whole app, chosen by the ROLE of the text, not by the space it has to fit:
 * if text does not fit, fix the layout instead of shrinking the role.
 *
 *   36 display · 30 auth title · 26 greeting · 24 screen title · 20 headline · 18 section title
 *   16 card title / body large / large button · 15 small title / body / button
 *   14 body small / label · 13 caption · 12 footnote · 11 micro
 */

export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextVariantSpec = {
  fontSize: number;
  lineHeight: number;
  weight: FontWeightName;
  letterSpacing?: number;
};

export const TextVariants = {
  // ── Display and headings ────────────────────────────────────────────────────────────────
  /** The "SKINDTECH" wordmark. Its wide tracking is part of the logo, not of the type scale. */
  brand: { fontSize: 14, lineHeight: 20, weight: 'medium', letterSpacing: 5 },
  /** Hero line of the Welcome screen. */
  display: { fontSize: 36, lineHeight: 46, weight: 'bold', letterSpacing: -0.5 },
  /** "Sign in" / "Sign up". */
  authTitle: { fontSize: 30, lineHeight: 40, weight: 'bold', letterSpacing: -0.4 },
  /** "Good afternoon, Name" on Home. */
  greeting: { fontSize: 26, lineHeight: 36, weight: 'bold', letterSpacing: -0.3 },
  /** The title of every screen (header, tab pages, Manage mode). Never shrunk to fit. */
  screenTitle: { fontSize: 24, lineHeight: 34, weight: 'bold' },
  /**
   * The single initial inside the round avatar. Its own token because it is a glyph drawn in a
   * fixed-size circle, not a line of text.
   */
  avatarLetter: { fontSize: 24, lineHeight: 30, weight: 'semibold' },
  /** Titles of bottom sheets and dialogs, and headlines of hero / empty-state cards. */
  headline: { fontSize: 20, lineHeight: 30, weight: 'bold' },

  // ── Titles ──────────────────────────────────────────────────────────────────────────────
  /** A heading above a group of cards or rows ("Latest result", "Recent scans"). */
  sectionTitle: { fontSize: 18, lineHeight: 27, weight: 'semibold' },
  /** The title inside a card, and headline values such as the acne amount. */
  cardTitle: { fontSize: 16, lineHeight: 24, weight: 'semibold' },
  /** A row title in a list, or a small heading inside a card. */
  titleSmall: { fontSize: 15, lineHeight: 23, weight: 'semibold' },

  // ── Body ────────────────────────────────────────────────────────────────────────────────
  /** Intro copy on the auth and welcome screens, and the text of links there. */
  bodyLarge: { fontSize: 16, lineHeight: 25, weight: 'regular' },
  /** The default reading text. */
  body: { fontSize: 15, lineHeight: 23, weight: 'regular' },
  /** Secondary paragraphs, list items and compact tile labels. */
  bodySmall: { fontSize: 14, lineHeight: 21, weight: 'regular' },
  /** Field labels, chips and small emphasised text (semibold). */
  label: { fontSize: 14, lineHeight: 21, weight: 'semibold' },

  // ── Supporting text ─────────────────────────────────────────────────────────────────────
  /** Dates, descriptions under a title, notices. */
  caption: { fontSize: 13, lineHeight: 20, weight: 'regular' },
  captionSemibold: { fontSize: 13, lineHeight: 20, weight: 'semibold' },
  /** Helper and fine print: text nobody needs in order to finish a task. */
  footnote: { fontSize: 12, lineHeight: 18, weight: 'regular' },
  footnoteSemibold: { fontSize: 12, lineHeight: 18, weight: 'semibold' },
  /** Only where space is genuinely fixed and the text is decorative. */
  micro: { fontSize: 11, lineHeight: 16, weight: 'regular' },

  // ── Buttons ─────────────────────────────────────────────────────────────────────────────
  buttonLarge: { fontSize: 16, lineHeight: 24, weight: 'semibold' },
  button: { fontSize: 15, lineHeight: 22, weight: 'semibold' },
} as const satisfies Record<string, TextVariantSpec>;

export type TextVariant = keyof typeof TextVariants;

/**
 * Thai glyphs stack vowels and tone marks above the x-height and need more vertical room than
 * the line heights above. From 24pt up the design's own ratio is roomy enough already, so the
 * floor is lower there and large Thai headings do not look loose.
 */
export const THAI_MIN_LINE_HEIGHT_RATIO = 1.5;
export const THAI_LARGE_MIN_LINE_HEIGHT_RATIO = 1.4;
const THAI_LARGE_FROM = 24;

export function resolveLineHeight(spec: TextVariantSpec, containsThai: boolean): number {
  if (!containsThai) return spec.lineHeight;
  const ratio = spec.fontSize >= THAI_LARGE_FROM ? THAI_LARGE_MIN_LINE_HEIGHT_RATIO : THAI_MIN_LINE_HEIGHT_RATIO;
  return Math.max(spec.lineHeight, Math.ceil(spec.fontSize * ratio));
}

/** Negative tracking makes stacked Thai vowels and tone marks collide, so Thai never gets it. */
export function resolveLetterSpacing(spec: TextVariantSpec, containsThai: boolean): number {
  const spacing = spec.letterSpacing ?? 0;
  return containsThai ? Math.max(spacing, 0) : spacing;
}

/** Same growth limit as `AppText`, so Dynamic Type cannot break a layout. */
export const MAX_FONT_SIZE_MULTIPLIER = 1.3;
