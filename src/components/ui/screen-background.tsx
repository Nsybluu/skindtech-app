import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Gradients } from '@/constants/colors';

/** The soft nude gradient every SKINDTECH frame sits on. */
export function ScreenBackground({ style, ...rest }: ViewProps) {
  return <View style={[styles.background, style]} {...rest} />;
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.background.base,
    experimental_backgroundImage: Gradients.screen,
  },
});
