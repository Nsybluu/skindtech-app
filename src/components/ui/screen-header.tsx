import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';
import { TextVariants, THAI_MIN_LINE_HEIGHT_RATIO, type TextVariant } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';

import { AppText } from './app-text';
import { IconButton } from './icon-button';

type ScreenHeaderProps = {
  title: string;
  titleVariant?: Extract<TextVariant, 'screenTitle' | 'screenTitleSmall'>;
  /** Defaults to going back in the navigation history. */
  onBack?: () => void;
  /** Right side content: an icon button or a short label. */
  accessory?: ReactNode;
  gap?: number;
};

export function goBackOr(fallback: () => void) {
  if (router.canGoBack()) {
    router.back();
  } else {
    fallback();
  }
}

/** Back button + bold title row used by every in-app screen. */
export function ScreenHeader({
  title,
  titleVariant = 'screenTitle',
  onBack,
  accessory,
  gap = Spacing.s,
}: ScreenHeaderProps) {
  const { t } = useI18n();
  // The tight Latin line height pushes Noto Sans Thai glyphs about 4pt above the
  // back button's centre. Using the same roomy line height as Thai for every
  // language keeps the title centred on the button in both.
  const lineHeight = Math.ceil(TextVariants[titleVariant].fontSize * THAI_MIN_LINE_HEIGHT_RATIO);

  return (
    <View style={[styles.row, { gap }]}>
      <IconButton
        accessibilityLabel={t.common.back}
        onPress={onBack ?? (() => goBackOr(() => router.replace('/')))}>
        <AppIcon icon={ChevronLeftIcon} size={18} color={Colors.text.muted} strokeWidth={2} />
      </IconButton>
      <AppText
        variant={titleVariant}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        accessibilityRole="header"
        style={[styles.title, { lineHeight }]}>
        {title}
      </AppText>
      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
