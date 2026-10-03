import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { cn } from '@/utils/cn';

type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  /** `emphasis` is the slightly brighter Scan tips button. */
  tone?: 'default' | 'emphasis';
};

/** 40 × 40 rounded square used for Back and Scan tips in screen headers. */
export function IconButton({ children, onPress, accessibilityLabel, tone = 'default' }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      className={cn(
        'size-10 items-center justify-center rounded-md border active:opacity-70',
        tone === 'emphasis' ? 'border-taupe/[0.28] bg-white/[0.72]' : 'border-taupe/[0.24] bg-white/[0.58]',
      )}>
      {children}
    </Pressable>
  );
}
