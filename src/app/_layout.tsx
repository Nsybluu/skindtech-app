import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/colors';
import { FontAssets } from '@/constants/typography';
import { I18nProvider } from '@/i18n/i18n-provider';
import { AppProvider, useSession } from '@/providers/app-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <I18nProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <AppShell />
      </AppProvider>
    </I18nProvider>
  );
}

function AppShell() {
  const { isSessionReady } = useSession();

  useEffect(() => {
    if (isSessionReady) void SplashScreen.hideAsync();
  }, [isSessionReady]);

  if (!isSessionReady) return null;
  return <RootNavigator />;
}

function RootNavigator() {
  const { isSignedIn } = useSession();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.base },
      }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="skin-profile" />
        <Stack.Screen name="photo-review" />
        <Stack.Screen name="image-quality" />
        <Stack.Screen name="analyzing" options={{ gestureEnabled: false }} />
        <Stack.Screen name="analysis-failed" />
        <Stack.Screen name="scan-result" />
        <Stack.Screen name="recommendation" />
        <Stack.Screen name="scan-history" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="about" />
      </Stack.Protected>
    </Stack>
  );
}
