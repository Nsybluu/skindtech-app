import type { SkinProfile } from '@/types/profile';

import { apiRequest } from './api';
import { invalidResponse } from './response-guards';
import { parseSkinProfile } from './skin-profile-parser';

type ProfileResponse = {
  status: 'success';
  data: { profile: unknown };
};

/** The user's Skin Profile. The backend is the source of truth for what was saved. */
export const profileService = {
  /** The saved profile, or `null` for an account that has not saved one yet. */
  async getSkinProfile(): Promise<SkinProfile | null> {
    const response = await apiRequest<ProfileResponse>('/profile/skin');
    const profile = response?.data?.profile;
    if (profile === undefined) throw invalidResponse();
    return profile === null ? null : parseSkinProfile(profile);
  },

  /**
   * Saves the profile and returns what the backend stored. The backend may normalize it
   * (for example it re-formats the ingredient list), so callers must use this result,
   * not the value they sent. Throws when the profile could not be saved.
   */
  async saveSkinProfile(profile: SkinProfile): Promise<SkinProfile> {
    const response = await apiRequest<ProfileResponse>('/profile/skin', {
      method: 'PUT',
      // Only the four contract fields (the backend rejects anything else) and no duplicate concerns.
      body: JSON.stringify({
        skinType: profile.skinType,
        sensitivity: profile.sensitivity,
        concerns: [...new Set(profile.concerns)],
        ingredientsToAvoid: profile.ingredientsToAvoid,
      }),
    });
    // A save must answer with a profile: `null` or garbage is not a saved profile.
    return parseSkinProfile(response?.data?.profile);
  },
};
