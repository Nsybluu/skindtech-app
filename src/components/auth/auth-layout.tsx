import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { ScreenBackground } from '@/components/ui/screen-background';
import { goBackOr } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
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
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerClassName="grow px-6"
          // The top and bottom padding follow the safe area (runtime values).
          contentContainerStyle={{ paddingTop: top(56), paddingBottom: bottom(Spacing.xxl) + Spacing.s }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="w-full max-w-content grow self-center">
            <View className="h-8 justify-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.common.back}
                hitSlop={10}
                onPress={() => goBackOr(() => router.replace('/welcome'))}
                className="absolute left-0 z-[1] active:opacity-60">
                <AppIcon icon={ChevronLeftIcon} size={28} color={Colors.icon.strong} strokeWidth={2} />
              </Pressable>
              <BrandWordmark />
            </View>
            {/* Keeps the form optically centred between the wordmark and the bottom. */}
            <View className="grow justify-center py-6">{children}</View>
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
    <View className="min-h-11 flex-row flex-wrap items-center justify-center gap-x-[5px]">
      <AppText variant="bodyLarge" className="text-fg-footer">
        {prompt}
      </AppText>
      <Pressable accessibilityRole="link" hitSlop={10} onPress={onPress} className="active:opacity-60">
        <AppText variant="buttonLarge" className="text-brand-primary">
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}
