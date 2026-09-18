import { router } from 'expo-router';

import { useUserData } from '@/providers/app-provider';

/**
 * A Skin Profile is required before the first scan. Opens the Skin Profile form
 * when it is missing, otherwise goes straight to the camera.
 */
export function useStartScan() {
  const { skinProfile } = useUserData();

  return () => {
    if (skinProfile) {
      router.navigate('/scan');
    } else {
      router.push({ pathname: '/skin-profile', params: { next: 'scan' } });
    }
  };
}
