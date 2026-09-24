import { router } from 'expo-router';

import { useUserData } from '@/providers/app-provider';

/**
 * A Skin Profile is required before the first scan. Opens the Skin Profile form when the
 * account has none, otherwise goes straight to the camera. It waits for the profile to
 * finish loading first, so a returning user is not sent to the form while it is still on its way.
 */
export function useStartScan() {
  const { ensureSkinProfile } = useUserData();

  return () => {
    void ensureSkinProfile().then((skinProfile) => {
      if (skinProfile) {
        router.navigate('/scan');
      } else {
        router.push({ pathname: '/skin-profile', params: { next: 'scan' } });
      }
    });
  };
}
