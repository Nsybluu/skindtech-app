import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  handleColor: string;
  /** Figma bottom padding before the home indicator is taken into account. */
  bottomPadding?: number;
  style?: StyleProp<ViewStyle>;
};

/** Modal sheet with dimmed backdrop and grab handle (Language, AI consent). */
export function BottomSheet({
  visible,
  onClose,
  children,
  handleColor,
  bottomPadding = Spacing.xl,
  style,
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
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
          style={styles.backdrop}
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(260)}
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: bottom(bottomPadding) }, style]}>
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.surface.backdrop,
  },
  sheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: Spacing.m,
    paddingHorizontal: Layout.screenPadding,
    alignItems: 'center',
    gap: Spacing.m,
    backgroundColor: Colors.background.sheet,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    gap: Spacing.m,
  },
});
