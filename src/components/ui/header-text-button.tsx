import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';

import { AppText } from './app-text';

type HeaderTextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

/** Short text action in a screen header ("Manage", "Select all", "Cancel"). */
export function HeaderTextButton({ label, onPress, disabled = false, accessibilityHint }: HeaderTextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.base, (pressed || disabled) && styles.dimmed]}>
      <AppText variant="label" color={Colors.brand.primary} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.iconButton,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  dimmed: {
    opacity: 0.5,
  },
});
