import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Alpha, Colors } from '@/constants/colors';
import { Layout, Shadows, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';

type ActionBarProps = {
  children: ReactNode;
  /** The Skin Profile save bar has a hairline top border. */
  bordered?: boolean;
};

/** White bar pinned to the bottom of a screen, holding one or two buttons. */
export function ActionBar({ children, bordered = false }: ActionBarProps) {
  const { bottom } = useDesignInsets();

  return (
    <View style={[styles.bar, bordered && styles.bordered, { paddingBottom: bottom(Spacing.xxl) }]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface.bar,
    boxShadow: Shadows.barUp,
    paddingTop: Spacing.l,
    paddingHorizontal: Layout.screenPadding,
  },
  bordered: {
    borderTopWidth: 1,
    borderTopColor: Alpha.taupe(0.22),
  },
  content: {
    flexDirection: 'row',
    gap: Spacing.m,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
});
