import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Effects } from '@/constants/effects';
import { Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { cn } from '@/utils/cn';

type ActionBarProps = {
  children: ReactNode;
  /** The Skin Profile save bar has a hairline top border. */
  bordered?: boolean;
};

/** White bar pinned to the bottom of a screen, holding one or two buttons. */
export function ActionBar({ children, bordered = false }: ActionBarProps) {
  const { bottom } = useDesignInsets();

  return (
    <View
      className={cn('bg-surface-bar px-5 pt-4', bordered && 'border-t border-t-taupe/[0.22]')}
      // The shadow is an Effect; the bottom padding follows the safe area (runtime value).
      style={[Effects.shadowBarUp, { paddingBottom: bottom(Spacing.xxl) }]}>
      <View className="w-full max-w-content flex-row gap-3 self-center">{children}</View>
    </View>
  );
}
