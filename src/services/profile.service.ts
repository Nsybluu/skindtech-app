import type { SkinProfile } from '@/types/profile';

import { mockResponse } from './api';

// TODO(api): PUT /profile/skin via Express.
export const profileService = {
  saveSkinProfile(profile: SkinProfile) {
    return mockResponse(profile);
  },
};
