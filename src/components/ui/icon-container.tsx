import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

type IconContainerProps = {
  children: ReactNode;
  /** Size, radius and tint (`size-*`, `rounded-*`, `bg-*`); the tint defaults to `bg-surface-icon-tint`. */
  className: string;
};

/** Tinted square / circle behind an icon. */
export function IconContainer({ children, className }: IconContainerProps) {
  return <View className={cn('items-center justify-center bg-surface-icon-tint', className)}>{children}</View>;
}
