import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import GoogleIcon from '@/assets/illustrations/google.svg';
import { AuthFooterLink, AuthLayout } from '@/components/auth/auth-layout';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useGoogleSignIn } from '@/hooks/use-google-sign-in';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';
import { authErrorMessage } from '@/utils/auth-errors';

/** Figma 03 — Sign Up. */
export default function SignUpScreen() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const google = useGoogleSignIn();

  const submit = async () => {
    if (submitting || google.busy) return;
    if (!email.includes('@')) {
      Alert.alert(t.authErrors.title, t.authErrors.invalidEmail);
      return;
    }
    if (password.length < 8) {
      Alert.alert(t.authErrors.title, t.authErrors.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t.authErrors.title, t.authErrors.passwordsDoNotMatch);
      return;
    }

    setSubmitting(true);
    try {
      signIn(await authService.signUpWithEmail(email, password));
    } catch (error) {
      Alert.alert(t.authErrors.title, authErrorMessage(error, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <View className="gap-1">
        <AppText variant="authTitle" accessibilityRole="header">
          {t.signUp.title}
        </AppText>
        <AppText variant="bodyLarge" className="text-fg-secondary">
          {t.signUp.subtitle}
        </AppText>
      </View>

      <View className="mt-6 gap-5">
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

      <View className="mt-8 gap-3">
        <AppButton
          label={submitting ? t.authErrors.creatingAccount : t.signUp.submit}
          onPress={submit}
          disabled={submitting || google.busy}
        />
        <AppButton
          variant="google"
          label={google.busy ? t.authErrors.signingIn : t.signUp.signUpWithGoogle}
          icon={<GoogleIcon />}
          onPress={() => void google.start()}
          disabled={submitting || google.busy}
        />
      </View>

      <View className="mt-6">
        <AuthFooterLink
          prompt={t.signUp.haveAccount}
          action={t.signUp.signIn}
          onPress={() => router.replace('/sign-in')}
        />
      </View>
    </AuthLayout>
  );
}
