import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import GoogleIcon from '@/assets/icons/google.svg';
import { AuthFooterLink, AuthLayout } from '@/components/auth/auth-layout';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';

/** Figma 03 — Sign Up. Creates a new mock user without a Skin Profile. */
export default function SignUpScreen() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submit = async () => {
    signIn(await authService.signUpWithEmail(email, password));
  };

  const signUpWithGoogle = async () => {
    signIn(await authService.signUpWithGoogle());
  };

  return (
    <AuthLayout>
      <View style={styles.intro}>
        <AppText variant="authTitle" accessibilityRole="header">
          {t.signUp.title}
        </AppText>
        <AppText variant="subtitle" color={Colors.text.secondary}>
          {t.signUp.subtitle}
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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <AppInput
          label={t.signUp.confirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <View style={styles.actions}>
        <AppButton label={t.signUp.submit} onPress={submit} />
        <AppButton
          variant="google"
          label={t.signUp.signUpWithGoogle}
          icon={<GoogleIcon />}
          onPress={signUpWithGoogle}
        />
      </View>

      <View style={styles.footer}>
        <AuthFooterLink
          prompt={t.signUp.haveAccount}
          action={t.signUp.signIn}
          onPress={() => router.replace('/sign-in')}
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
    gap: Spacing.m,
  },
  footer: {
    marginTop: Spacing.xxl,
  },
});
