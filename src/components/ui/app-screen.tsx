import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { cn } from '@/utils/cn';

import { ScreenBackground } from './screen-background';

type AppScreenProps = {
  /** Fixed header (usually <ScreenHeader />). */
  header?: ReactNode;
  /** Fixed bottom content (usually <ActionBar />). */
  footer?: ReactNode;
  children: ReactNode;
  /** Classes of the column that holds the children; they replace the default `gap-3`. */
  contentClassName?: string;
  keyboardAware?: boolean;
  /** Adds pull-to-refresh to the scrolling body. */
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Standard in-app screen: gradient, fixed header, scrolling body, optional action bar. */
export function AppScreen({
  header,
  footer,
  children,
  contentClassName,
  keyboardAware = false,
  onRefresh,
  refreshing = false,
}: AppScreenProps) {
  const { top, bottom } = useDesignInsets();

  const body = (
    <>
      {header ? (
        // The top padding follows the status bar / notch (runtime value).
        <View className="px-5" style={{ paddingTop: top(40) }}>
          <View className="w-full max-w-content self-center">{header}</View>
        </View>
      ) : null}
      <ScrollView
        className="flex-1"
        contentContainerClassName={cn('grow px-5', header ? 'pt-4' : null, footer ? 'pb-4' : null)}
        // Without a header or footer the padding follows the safe area (runtime value).
        // (Keys are left out, not set to `undefined`: an `undefined` would wipe the class's padding.)
        contentContainerStyle={{
          ...(header ? null : { paddingTop: top(40) }),
          ...(footer ? null : { paddingBottom: bottom(Spacing.xxl) }),
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brand.primary}
              colors={[Colors.brand.primary]}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}>
        <View className={cn('w-full max-w-content gap-3 self-center', contentClassName)}>{children}</View>
      </ScrollView>
      {footer}
    </>
  );

  return (
    <ScreenBackground>
      {keyboardAware ? (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </ScreenBackground>
  );
}
