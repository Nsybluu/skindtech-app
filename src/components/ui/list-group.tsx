import { Children, Fragment, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type ListGroupProps = {
  children: ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  dividerColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Rounded card with hairline dividers between rows. */
export function ListGroup({
  children,
  backgroundColor = Colors.surface.list,
  borderColor = Colors.border.subtle,
  dividerColor = Colors.border.divider,
  style,
}: ListGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View style={[styles.group, { backgroundColor, borderColor }, style]}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: dividerColor }]} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

type ListRowProps = {
  children: ReactNode;
  onPress?: () => void;
  minHeight: number;
  gap?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  backgroundColor?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean; checked?: boolean };
  accessibilityRole?: 'button' | 'radio' | 'link';
};

/** A horizontal row inside a ListGroup; pressable when `onPress` is set. */
export function ListRow({
  children,
  onPress,
  minHeight,
  gap = Spacing.m,
  paddingHorizontal = Spacing.m,
  paddingVertical = Spacing.s,
  backgroundColor,
  accessibilityLabel,
  accessibilityState,
  accessibilityRole = 'button',
}: ListRowProps) {
  const rowStyle = [styles.row, { minHeight, gap, paddingHorizontal, paddingVertical, backgroundColor }];

  if (!onPress) {
    return <View style={rowStyle}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: Radius.l,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: Alpha.rose(0.06),
  },
});
