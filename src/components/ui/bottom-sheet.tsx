import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Figma bottom padding before the home indicator is taken into account. */
  bottomPadding?: number;
  /** Replaces the sheet's own classes (`bg-canvas-sheet`, `gap-3`, ...). */
  className?: string;
  /** Replaces the grab handle's colour (`bg-*`). */
  handleClassName?: string;
  /** For an `Effects` shadow only; everything else is a class. */
  style?: StyleProp<ViewStyle>;
  /** Lifts the sheet above the keyboard (sheets with a text field). */
  keyboardAware?: boolean;
};

/** Modal sheet with dimmed backdrop and grab handle (Language, AI consent). */
export function BottomSheet({
  visible,
  onClose,
  children,
  bottomPadding = Spacing.xl,
  className,
  handleClassName,
  style,
  keyboardAware = false,
}: BottomSheetProps) {
  const { t } = useI18n();
  const { bottom } = useDesignInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        enabled={keyboardAware}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
          className="absolute inset-0 bg-surface-backdrop"
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(260)}
          accessibilityViewIsModal
          className={cn('items-center gap-3 rounded-t-sheet bg-canvas-sheet px-5 pt-3', className)}
          // Bottom padding follows the safe area (runtime value).
          style={[style, { paddingBottom: bottom(bottomPadding) }]}>
          <View className={cn('h-1 w-9 rounded-full bg-[rgba(201,181,174,0.8)]', handleClassName)} />
          <View className="w-full max-w-content gap-3">{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
