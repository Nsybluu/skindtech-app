import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthFooterLink, AuthLayout } from '@/components/auth/auth-layout';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';
import { showMockupOnlyAlert } from '@/utils/alerts';

/** Figma 02 — Sign In (any input is accepted in the mockup). */
export default function SignInScreen() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    signIn(await authService.signInWithEmail(email, password));
  };

  return (
    <AuthLayout>
      <View style={styles.intro}>
        <AppText variant="authTitle" accessibilityRole="header">
          {t.signIn.title}
        </AppText>
        <AppText variant="subtitle" color={Colors.text.secondary}>
          {t.signIn.subtitle}
        </AppText>
      </View>

      <View style={styles.form}>
        <AppInput
          label={t.signIn.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AppInput
          label={t.signIn.password}
          value={password}
          onChangeText={setPassword}
          secure
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <View style={styles.actions}>
        <AppButton label={t.signIn.submit} onPress={submit} style={styles.fullWidth} />
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => showMockupOnlyAlert(t, t.signIn.forgotPassword)}>
          {({ pressed }) => (
            <AppText
              variant="body"
              color={Colors.brand.primary}
              align="center"
              style={pressed && styles.pressed}>
              {t.signIn.forgotPassword}
            </AppText>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        <AuthFooterLink
          prompt={t.signIn.noAccount}
          action={t.signIn.signUp}
          onPress={() => router.replace('/sign-up')}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: Spacing.xs,
  },
  form: {
    marginTop: Spacing.xxl,
    gap: Spacing.xl,
  },
  actions: {
    marginTop: Spacing.xxxl,
    gap: Spacing.l,
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  footer: {
    marginTop: Spacing.xxl,
  },
  pressed: {
    opacity: 0.6,
  },
});
