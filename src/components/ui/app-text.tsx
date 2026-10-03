import { Platform, Text, type TextProps } from 'react-native';

import {
  kebabCase,
  MAX_FONT_SIZE_MULTIPLIER,
  TextVariants,
  type FontWeightName,
  type TextVariant,
} from '@/constants/text-variants';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

const THAI_CHARACTERS = /[฀-๿]/;

/** Android adds invisible padding above and below text; there is no Tailwind class to switch it off. */
const ANDROID_TEXT = Platform.select({
  android: { includeFontPadding: false, textAlignVertical: 'center' as const },
  default: undefined,
});

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  /** Overrides the weight of the variant (`font-noto-<weight>`). */
  weight?: FontWeightName;
};

/**
 * All app text goes through here so Noto Sans Thai, line heights and
 * Thai-specific spacing stay consistent. Size, line height and tracking come from the
 * `text-<variant>` class (and `text-<variant>-th` for Thai, generated from the same scale);
 * the colour defaults to `text-fg-primary` and any `className` colour or alignment replaces it.
 */
export function AppText({ variant = 'body', weight, className, style, children, ...rest }: AppTextProps) {
  const { language } = useI18n();
  const spec = TextVariants[variant];

  const containsThai =
    language === 'th' || (typeof children === 'string' && THAI_CHARACTERS.test(children));

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
      className={cn(
        `text-${kebabCase(variant)}${containsThai ? '-th' : ''}`,
        `font-noto-${weight ?? spec.weight}`,
        'text-fg-primary',
        className,
      )}
      style={style ? [ANDROID_TEXT, style] : ANDROID_TEXT}
      {...rest}>
      {children}
    </Text>
  );
}
