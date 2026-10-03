import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

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
  /** Replaces the default `gap-2`. */
  className?: string;
};

export function goBackOr(fallback: () => void) {
  if (router.canGoBack()) {
    router.back();
  } else {
    fallback();
  }
}

/** Back button + bold title row used by every in-app screen. */
export function ScreenHeader({ title, onBack, backLabel, accessory, className }: ScreenHeaderProps) {
  const { t } = useI18n();

  return (
    <View className={cn('min-h-11 flex-row items-center gap-2', className)}>
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
      <AppText variant="screenTitle" numberOfLines={2} accessibilityRole="header" className="flex-1">
        {title}
      </AppText>
      {accessory}
    </View>
  );
}
