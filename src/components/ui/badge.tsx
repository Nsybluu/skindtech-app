import { View } from 'react-native';

import { cn } from '@/utils/cn';

import { AppText } from './app-text';

type BadgeProps = {
  label: string;
  /** Size and colour classes (`h-*`, `min-w-*`, `bg-*`) that replace the defaults. */
  className?: string;
  /** Replaces the default `text-brand-primary`. */
  textClassName?: string;
};

/** Small rose pill ("Preliminary", "Required", "3 steps"). */
export function Badge({ label, className, textClassName }: BadgeProps) {
  return (
    <View className={cn('h-[22px] items-center justify-center rounded-full bg-rose/[0.1] px-2', className)}>
      <AppText variant="footnoteSemibold" className={cn('text-brand-primary', textClassName)} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}
