import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { ScreenBackground } from '@/components/ui/screen-background';
import { goBackOr } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';

type AuthLayoutProps = {
  children: ReactNode;
};

/** Sign in / Sign up frame: back chevron, centered wordmark, scrolling form. */
export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useI18n();
  const { top, bottom } = useDesignInsets();

  return (
    <ScreenBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: top(56), paddingBottom: bottom(Spacing.xxl) + Spacing.s },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.constrained}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.common.back}
                hitSlop={10}
                onPress={() => goBackOr(() => router.replace('/welcome'))}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <AppIcon icon={ChevronLeftIcon} size={28} color={Colors.icon.strong} strokeWidth={2} />
              </Pressable>
              <BrandWordmark />
            </View>
            <View style={styles.body}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

type AuthFooterLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

/** "Don’t have an account? Sign up" row. */
export function AuthFooterLink({ prompt, action, onPress }: AuthFooterLinkProps) {
  return (
    <View style={styles.footer}>
      <AppText variant="bodyLarge" color={Colors.text.footer}>
        {prompt}
      </AppText>
      <Pressable accessibilityRole="link" hitSlop={10} onPress={onPress}>
        {({ pressed }) => (
          <AppText variant="bodyLarge" weight="semibold" color={Colors.brand.primary} style={pressed && styles.pressed}>
            {action}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Layout.authPadding,
  },
  constrained: {
    flexGrow: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  /** Keeps the form optically centred between the wordmark and the bottom. */
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  header: {
    height: 32,
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  footer: {
    minHeight: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 5,
  },
  pressed: {
    opacity: 0.6,
  },
});
