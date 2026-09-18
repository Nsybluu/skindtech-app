import { StyleSheet, View } from 'react-native';

import { Alpha, Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

import { AppText } from './app-text';

type BadgeProps = {
  label: string;
  height?: number;
  minWidth?: number;
  backgroundColor?: string;
  color?: string;
};

/** Small rose pill ("Preliminary", "Required", "3 steps"). */
export function Badge({
  label,
  height = 22,
  minWidth,
  backgroundColor = Alpha.rose(0.1),
  color = Colors.brand.primary,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { height, minWidth, borderRadius: height / 2, backgroundColor }]}>
      <AppText variant="footnoteSemibold" color={color} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s,
  },
});
