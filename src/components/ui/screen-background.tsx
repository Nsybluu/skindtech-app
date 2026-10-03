import { View, type ViewProps } from 'react-native';

import { Effects } from '@/constants/effects';
import { cn } from '@/utils/cn';

/** The soft nude gradient every SKINDTECH frame sits on. */
export function ScreenBackground({ className, style, ...rest }: ViewProps) {
  return (
    <View
      className={cn('flex-1 bg-canvas-base', className)}
      style={[Effects.gradientScreen, style]}
      {...rest}
    />
  );
}
