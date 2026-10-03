import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { AuthFooterLink, AuthLayout } from '@/components/auth/auth-layout';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useI18n } from '@/i18n/i18n-provider';
import { useSession } from '@/providers/app-provider';
import { authService } from '@/services/auth.service';
import { authErrorMessage } from '@/utils/auth-errors';
import { showMockupOnlyAlert } from '@/utils/alerts';

/** Figma 02 — Sign In. */
export default function SignInScreen() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    if (!email.includes('@')) {
      Alert.alert(t.authErrors.title, t.authErrors.invalidEmail);
      return;
    }
    if (password.length < 8) {
      Alert.alert(t.authErrors.title, t.authErrors.passwordTooShort);
      return;
    }

    setSubmitting(true);
    try {
      signIn(await authService.signInWithEmail(email, password));
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
          {t.signIn.title}
        </AppText>
        <AppText variant="bodyLarge" className="text-fg-secondary">
          {t.signIn.subtitle}
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
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <View className="mt-8 items-center gap-4">
        <AppButton
          label={submitting ? t.authErrors.signingIn : t.signIn.submit}
          onPress={submit}
          disabled={submitting}
          className="self-stretch"
        />
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => showMockupOnlyAlert(t, t.signIn.forgotPassword)}
          className="active:opacity-60">
          <AppText variant="body" className="text-center text-brand-primary">
            {t.signIn.forgotPassword}
          </AppText>
        </Pressable>
      </View>

      <View className="mt-6">
        <AuthFooterLink
          prompt={t.signIn.noAccount}
          action={t.signIn.signUp}
          onPress={() => router.replace('/sign-up')}
        />
      </View>
    </AuthLayout>
  );
}
