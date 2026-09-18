/**
 * Typography tokens.
 *
 * Figma uses Noto Sans Thai at the SemiCondensed width (wdth 87.5). React Native
 * cannot drive variable-font axes, so static SemiCondensed instances are bundled
 * in assets/fonts and each weight is its own family.
 *
 * Sizes follow one scale (40 · 32 · 26 · 24 · 22 · 20 · 17 · 16 · 15 · 14 · 13 · 12 · 11)
 * instead of the per-frame values in Figma, so text stays consistent across screens.
 */

export const FontFamily = {
  regular: 'NotoSansThaiSemiCondensed-Regular',
  medium: 'NotoSansThaiSemiCondensed-Medium',
  semibold: 'NotoSansThaiSemiCondensed-SemiBold',
  bold: 'NotoSansThaiSemiCondensed-Bold',
} as const;

export type FontWeightName = keyof typeof FontFamily;

export const FontAssets = {
  [FontFamily.regular]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Regular.ttf'),
  [FontFamily.medium]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Medium.ttf'),
  [FontFamily.semibold]: require('@/assets/fonts/NotoSansThaiSemiCondensed-SemiBold.ttf'),
  [FontFamily.bold]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Bold.ttf'),
};

type TextVariantSpec = {
  fontSize: number;
  lineHeight: number;
  weight: FontWeightName;
  letterSpacing?: number;
};

export const TextVariants = {
  /** "SKINDTECH" wordmark */
  brand: { fontSize: 14, lineHeight: 20, weight: 'medium', letterSpacing: 5 },

  // Headings
  display: { fontSize: 40, lineHeight: 48, weight: 'bold', letterSpacing: -0.5 },
  authTitle: { fontSize: 32, lineHeight: 40, weight: 'bold', letterSpacing: -0.4 },
  greeting: { fontSize: 26, lineHeight: 32, weight: 'bold', letterSpacing: -0.3 },
  screenTitle: { fontSize: 24, lineHeight: 30, weight: 'bold' },
  avatarLetter: { fontSize: 24, lineHeight: 30, weight: 'semibold' },
  cardHeadline: { fontSize: 22, lineHeight: 28, weight: 'bold', letterSpacing: -0.2 },
  sheetTitle: { fontSize: 20, lineHeight: 26, weight: 'bold' },
  screenTitleSmall: { fontSize: 20, lineHeight: 26, weight: 'bold' },

  // Section and card titles
  titleLarge: { fontSize: 17, lineHeight: 24, weight: 'semibold' },
  title: { fontSize: 16, lineHeight: 22, weight: 'semibold' },
  titleSmall: { fontSize: 15, lineHeight: 21, weight: 'semibold' },

  // Body
  subtitle: { fontSize: 16, lineHeight: 22, weight: 'regular' },
  bodyLarge: { fontSize: 16, lineHeight: 22, weight: 'regular' },
  body: { fontSize: 15, lineHeight: 21, weight: 'regular' },
  bodySmall: { fontSize: 14, lineHeight: 20, weight: 'regular' },
  label: { fontSize: 14, lineHeight: 20, weight: 'semibold' },
  /** Numbered routine steps and bullet lists. */
  listStep: { fontSize: 14, lineHeight: 22, weight: 'regular' },

  // Supporting text
  caption: { fontSize: 13, lineHeight: 18, weight: 'regular' },
  captionSemibold: { fontSize: 13, lineHeight: 18, weight: 'semibold' },
  footnote: { fontSize: 12, lineHeight: 16, weight: 'regular' },
  footnoteSemibold: { fontSize: 12, lineHeight: 16, weight: 'semibold' },
  micro: { fontSize: 11, lineHeight: 15, weight: 'regular' },

  // Buttons
  buttonLarge: { fontSize: 16, lineHeight: 22, weight: 'semibold' },
  button: { fontSize: 15, lineHeight: 21, weight: 'semibold' },
} as const satisfies Record<string, TextVariantSpec>;

export type TextVariant = keyof typeof TextVariants;

/**
 * Thai glyphs stack vowels and tone marks above the x-height, so Thai copy needs
 * more vertical room than the English line heights used in Figma.
 */
export const THAI_MIN_LINE_HEIGHT_RATIO = 1.5;
