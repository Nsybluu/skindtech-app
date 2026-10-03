import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/utils/cn';

type ActionRowProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  /** Colour class of the label; defaults to `text-brand-primary`. */
  colorClassName?: string;
  /** Emphasised rows (destructive or standalone) use the semibold small-title style. */
  emphasized?: boolean;
  /** Standalone rows have their own card background; list rows don't. */
  standalone?: boolean;
  /** Dims the row and ignores presses (an action that is already running). */
  disabled?: boolean;
};

/** "Privacy policy ›" / "Delete account ›" style row. */
export function ActionRow({
  icon,
  label,
  onPress,
  colorClassName = 'text-brand-primary',
  emphasized = false,
  standalone = false,
  disabled = false,
}: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-[52px] flex-row items-center gap-3 p-3 active:opacity-70',
        standalone && 'min-h-14 rounded-lg border border-line-subtle bg-surface-list',
        disabled && 'opacity-50',
      )}>
      {icon}
      <AppText variant={emphasized ? 'titleSmall' : 'body'} className={cn('flex-1', colorClassName)}>
        {label}
      </AppText>
    </Pressable>
  );
}
