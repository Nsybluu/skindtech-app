import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useI18n } from '@/i18n/i18n-provider';
import { useSession } from '@/providers/app-provider';
import { ApiError } from '@/services/api';
import { authService } from '@/services/auth.service';
import { requestGoogleIdToken } from '@/services/google-sign-in.service';
import { authErrorMessage } from '@/utils/auth-errors';

/**
 * Google button behaviour shared by Welcome and Sign up: native account chooser,
 * then the app's own session through `POST /auth/google`.
 */
export function useGoogleSignIn() {
  const { t } = useI18n();
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  // A ref rather than `busy`: two taps in the same frame would both still read `false`.
  const running = useRef(false);

  const start = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);

    try {
      const result = await requestGoogleIdToken();
      // Closing the Google dialog is a choice, not an error: stay on the screen, say nothing.
      if (result.status === 'cancelled') return;

      signIn(await authService.signInWithGoogle(result.idToken));
    } catch (error) {
      const message = authErrorMessage(error, t, 'google');

      if (error instanceof ApiError && error.code === 'ACCOUNT_LINK_REQUIRED') {
        // The email already belongs to a password account, so offer the way forward.
        Alert.alert(t.authErrors.googleTitle, message, [
          { text: t.common.ok, style: 'cancel' },
          { text: t.welcome.signIn, onPress: () => router.navigate('/sign-in') },
        ]);
      } else {
        Alert.alert(t.authErrors.googleTitle, message, [{ text: t.common.ok }]);
      }
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return { start, busy };
}
