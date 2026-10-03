import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { cn } from '@/utils/cn';

type StateCardProps = {
  /** Shows a spinner instead of `icon`. */
  loading?: boolean;
  icon?: ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

/** A loading / "couldn't load" / empty block with an optional retry button. */
export function StateCard({ loading = false, icon, title, body, actionLabel, onAction, className }: StateCardProps) {
  return (
    <View
      accessibilityRole={loading ? 'progressbar' : undefined}
      accessibilityLiveRegion="polite"
      className={cn('items-center gap-2 rounded-lg border border-line-subtle bg-white/[0.7] p-5', className)}>
      {loading ? <ActivityIndicator color={Colors.brand.primary} /> : icon}
      <AppText variant="cardTitle" className="text-center">
        {title}
      </AppText>
      {body ? (
        <AppText variant="bodySmall" className="text-center text-fg-secondary">
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton variant="secondary" label={actionLabel} onPress={onAction} className="mt-1 self-stretch" />
      ) : null}
    </View>
  );
}
