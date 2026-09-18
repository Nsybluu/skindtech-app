import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Layout, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';

import { ScreenBackground } from './screen-background';

type AppScreenProps = {
  /** Fixed header (usually <ScreenHeader />). */
  header?: ReactNode;
  /** Fixed bottom content (usually <ActionBar />). */
  footer?: ReactNode;
  children: ReactNode;
  /** Gap between header and scroll content (Figma: 14). */
  contentTopSpacing?: number;
  /** Vertical gap between direct children. */
  gap?: number;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAware?: boolean;
};

/** Standard in-app screen: gradient, fixed header, scrolling body, optional action bar. */
export function AppScreen({
  header,
  footer,
  children,
  contentTopSpacing = Spacing.l,
  gap = Spacing.m,
  contentStyle,
  keyboardAware = false,
}: AppScreenProps) {
  const { top, bottom } = useDesignInsets();

  const body = (
    <>
      {header ? (
        <View style={[styles.header, { paddingTop: top(40) }]}>
          <View style={styles.constrained}>{header}</View>
        </View>
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: header ? contentTopSpacing : top(40),
            paddingBottom: footer ? Spacing.l : bottom(Spacing.xxl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.constrained, { gap }, contentStyle]}>{children}</View>
      </ScrollView>
      {footer}
    </>
  );

  return (
    <ScreenBackground>
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  constrained: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
});
