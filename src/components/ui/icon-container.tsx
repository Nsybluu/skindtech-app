import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';

type IconContainerProps = {
  children: ReactNode;
  size: number;
  radius: number;
  backgroundColor?: string;
};

/** Tinted square / circle behind an icon. */
export function IconContainer({
  children,
  size,
  radius,
  backgroundColor = Colors.surface.iconTint,
}: IconContainerProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: radius, backgroundColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
