import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type ActionRowProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
  weight?: 'regular' | 'semibold';
  /** Standalone rows have their own card background; list rows don't. */
  standalone?: boolean;
};

/** "Privacy policy ›" / "Delete account ›" style row. */
export function ActionRow({
  icon,
  label,
  onPress,
  color = Colors.brand.primary,
  weight = 'regular',
  standalone = false,
}: ActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, standalone && styles.standalone, pressed && styles.pressed]}>
      {icon}
      <AppText variant="bodySmall" weight={weight} color={color} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },
  standalone: {
    minHeight: 56,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.surface.list,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
