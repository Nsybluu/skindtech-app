import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import GoogleIcon from '@/assets/icons/google.svg';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { BrandWordmark } from '@/components/ui/brand-wordmark';
import { ScreenBackground } from '@/components/ui/screen-background';
import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';
import { useDesignInsets } from '@/hooks/use-design-insets';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 01 — Welcome */
export default function WelcomeScreen() {
  const { t } = useI18n();
  const { top, insets } = useDesignInsets();

  const signInWithGoogle = () => {
    Alert.alert(t.authErrors.googleTitle, t.authErrors.googlePhase);
  };

  return (
    <ScreenBackground>
      <View
        style={[
          styles.container,
          { paddingTop: top(56), paddingBottom: insets.bottom + Spacing.xxxl },
        ]}>
        <View style={styles.brandRow}>
          <BrandWordmark />
        </View>

        <View style={styles.illustrationSlot}>
          <Image
            source={require('@/assets/images/face-scan-illustration.png')}
            contentFit="contain"
            style={styles.illustration}
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={styles.intro}>
          <AppText variant="display" align="center">
            {t.welcome.title}
          </AppText>
          <AppText variant="bodyLarge" color={Colors.text.tagline} align="center">
            {t.welcome.tagline}
          </AppText>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <AppButton label={t.welcome.signIn} onPress={() => router.push('/sign-in')} />
          <AppButton
            variant="google"
            label={t.welcome.signInWithGoogle}
            icon={<GoogleIcon />}
            onPress={signInWithGoogle}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const ILLUSTRATION_WIDTH = 246;
const ILLUSTRATION_HEIGHT = 342;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Layout.authPadding,
  },
  brandRow: {
    height: 32,
    justifyContent: 'center',
  },
  illustrationSlot: {
    marginTop: Spacing.l,
    flexShrink: 1,
    alignItems: 'center',
  },
  illustration: {
    height: ILLUSTRATION_HEIGHT,
    maxHeight: '100%',
    aspectRatio: ILLUSTRATION_WIDTH / ILLUSTRATION_HEIGHT,
  },
  intro: {
    marginTop: Spacing.xxl,
    gap: Spacing.s,
  },
  spacer: {
    flexGrow: 1,
    minHeight: Spacing.xxl,
  },
  actions: {
    gap: Spacing.m,
  },
});
