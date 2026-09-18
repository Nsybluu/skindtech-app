import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  FontFamily,
  THAI_MIN_LINE_HEIGHT_RATIO,
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
  const letterSpacing = 'letterSpacing' in spec ? spec.letterSpacing : 0;

  return (
    <Text
      maxFontSizeMultiplier={1.3}
      style={[
        styles.base,
        {
          fontFamily: FontFamily[weight ?? spec.weight],
          fontSize: spec.fontSize,
          lineHeight: containsThai
            ? Math.max(spec.lineHeight, Math.ceil(spec.fontSize * THAI_MIN_LINE_HEIGHT_RATIO))
            : spec.lineHeight,
          // Negative tracking makes stacked Thai vowels and tone marks collide.
          letterSpacing: containsThai ? Math.max(letterSpacing, 0) : letterSpacing,
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
