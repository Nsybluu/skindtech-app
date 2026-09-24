import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

import { AppText } from './app-text';
import { HeaderTextButton } from './header-text-button';
import { IconButton } from './icon-button';

type ScreenHeaderProps = {
  title: string;
  /** Defaults to going back in the navigation history. */
  onBack?: () => void;
  /** Replaces the chevron with a text button (e.g. "Cancel" while a mode is active). */
  backLabel?: string;
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
  onBack,
  backLabel,
  accessory,
  gap = Spacing.s,
}: ScreenHeaderProps) {
  const { t } = useI18n();

  return (
    <View style={[styles.row, { gap }]}>
      {backLabel ? (
        <HeaderTextButton label={backLabel} onPress={onBack ?? (() => goBackOr(() => router.replace('/')))} />
      ) : (
        <IconButton
          accessibilityLabel={t.common.back}
          onPress={onBack ?? (() => goBackOr(() => router.replace('/')))}>
          <AppIcon icon={ChevronLeftIcon} size={18} color={Colors.text.muted} strokeWidth={2} />
        </IconButton>
      )}
      {/* Every screen title is the same size. A long one wraps to a second line; it is never shrunk. */}
      <AppText
        variant="screenTitle"
        numberOfLines={2}
        accessibilityRole="header"
        style={styles.title}>
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
