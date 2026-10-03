import { router } from 'expo-router';
import { View } from 'react-native';

import GoogleIcon from '@/assets/illustrations/google.svg';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Image } from '@/components/ui/styled';
import { Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 01 — Welcome */
export default function WelcomeScreen() {
  const { t } = useI18n();
  const { top, insets } = useDesignInsets();

  const google = useGoogleSignIn();

  return (
    <ScreenBackground>
      <View
        className="w-full max-w-content flex-1 self-center px-6"
        // The top and bottom padding follow the safe area (runtime values).
        style={{ paddingTop: top(56), paddingBottom: insets.bottom + Spacing.xxxl }}>
        <View className="h-8 justify-center">
          <BrandWordmark />
        </View>

        <View className="mt-4 shrink items-center">
          <Image
            source={require('@/assets/images/face-scan-illustration.png')}
            contentFit="contain"
            className="aspect-[246/342] h-[342px] max-h-full"
            accessibilityIgnoresInvertColors
          />
        </View>

        <View className="mt-6 gap-2">
          <AppText variant="display" className="text-center">
            {t.welcome.title}
          </AppText>
          <AppText variant="bodyLarge" className="text-center text-fg-tagline">
            {t.welcome.tagline}
          </AppText>
        </View>

        <View className="min-h-6 grow" />

        <View className="gap-3">
          <AppButton
            label={t.welcome.signIn}
            onPress={() => router.push('/sign-in')}
            disabled={google.busy}
          />
          <AppButton
            variant="google"
            label={google.busy ? t.authErrors.signingIn : t.welcome.signInWithGoogle}
            icon={<GoogleIcon />}
            onPress={() => void google.start()}
            disabled={google.busy}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}
