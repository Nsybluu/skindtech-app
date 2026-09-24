import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  FontFamily,
  MAX_FONT_SIZE_MULTIPLIER,
  resolveLetterSpacing,
  resolveLineHeight,
  TextVariants,
  type FontWeightName,
  type TextVariant,
} from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';

const THAI_CHARACTERS = /[฀-๿]/;

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  weight?: FontWeightName;
  color?: string;
  align?: TextStyle['textAlign'];
};

/**
 * All app text goes through here so Noto Sans Thai, line heights and
 * Thai-specific spacing stay consistent.
 */
export function AppText({
  variant = 'body',
  weight,
  color = Colors.text.primary,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { language } = useI18n();
  const spec = TextVariants[variant];

  const containsThai =
    language === 'th' || (typeof children === 'string' && THAI_CHARACTERS.test(children));

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      style={[
        styles.base,
        {
          fontFamily: FontFamily[weight ?? spec.weight],
          fontSize: spec.fontSize,
          lineHeight: resolveLineHeight(spec, containsThai),
          letterSpacing: resolveLetterSpacing(spec, containsThai),
          color,
          textAlign: align,
        },
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: Platform.select({
    android: { includeFontPadding: false, textAlignVertical: 'center' },
    default: {},
  }),
});
