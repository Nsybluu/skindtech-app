/**
 * Typography tokens: the font files and the text scale (`text-variants.ts`).
 *
 * Figma uses Noto Sans Thai at the SemiCondensed width (wdth 87.5). React Native cannot drive
 * variable-font axes, so static SemiCondensed instances are bundled in assets/fonts and each
 * weight is its own family.
 */

import type { TextStyle } from 'react-native';

import { TextVariants, type FontWeightName, type TextVariant } from './text-variants';

export {
  MAX_FONT_SIZE_MULTIPLIER,
  resolveLetterSpacing,
  resolveLineHeight,
  THAI_LARGE_MIN_LINE_HEIGHT_RATIO,
  THAI_MIN_LINE_HEIGHT_RATIO,
  TextVariants,
  type FontWeightName,
  type TextVariant,
  type TextVariantSpec,
} from './text-variants';

export const FontFamily = {
  regular: 'NotoSansThaiSemiCondensed-Regular',
  medium: 'NotoSansThaiSemiCondensed-Medium',
  semibold: 'NotoSansThaiSemiCondensed-SemiBold',
  bold: 'NotoSansThaiSemiCondensed-Bold',
} as const satisfies Record<FontWeightName, string>;

export const FontAssets = {
  [FontFamily.regular]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Regular.ttf'),
  [FontFamily.medium]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Medium.ttf'),
  [FontFamily.semibold]: require('@/assets/fonts/NotoSansThaiSemiCondensed-SemiBold.ttf'),
  [FontFamily.bold]: require('@/assets/fonts/NotoSansThaiSemiCondensed-Bold.ttf'),
};

/**
 * Font family and size for a `TextInput`, taken from the same scale as `AppText` so typed text
 * matches the labels around it. No line height: on iOS a fixed line height on a single-line
 * input pushes the text off-centre; multiline inputs ask for theirs with `multiline: true`.
 */
export function inputTextStyle(
  variant: TextVariant = 'bodyLarge',
  options: { multiline?: boolean } = {},
): Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight'> {
  const spec = TextVariants[variant];
  return {
    fontFamily: FontFamily[spec.weight],
    fontSize: spec.fontSize,
    ...(options.multiline ? { lineHeight: spec.lineHeight } : {}),
  };
}
