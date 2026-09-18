import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Alpha } from '@/constants/colors';
import { Layout, Radius } from '@/constants/spacing';

type IconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  /** `emphasis` is the slightly brighter Scan tips button. */
  tone?: 'default' | 'emphasis';
};

/** 34 × 34 rounded square used for Back and Scan tips in screen headers. */
export function IconButton({ children, onPress, accessibilityLabel, tone = 'default' }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.base, tone === 'emphasis' && styles.emphasis, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: Layout.iconButton,
    height: Layout.iconButton,
    borderRadius: Radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Alpha.white(0.58),
    borderWidth: 1,
    borderColor: Alpha.taupe(0.24),
  },
  emphasis: {
    backgroundColor: Alpha.white(0.72),
    borderColor: Alpha.taupe(0.28),
  },
  pressed: {
    opacity: 0.7,
  },
});
