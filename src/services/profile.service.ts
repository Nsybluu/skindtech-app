import {
  SKIN_CONCERNS,
  SKIN_SENSITIVITIES,
  SKIN_TYPES,
  type SkinConcern,
  type SkinProfile,
  type SkinSensitivity,
  type SkinType,
} from '@/types/profile';

import { apiRequest } from './api';
import { ApiError } from './api-error';

type ProfileResponse = {
  status: 'success';
  data: { profile: unknown };
};

const invalid = () => new ApiError(502, 'INVALID_RESPONSE');

/**
 * Accepts only a well-formed profile and copies just the known fields. Anything else is
 * an error, so a malformed answer can never be mistaken for a saved profile.
 */
function parseProfile(value: unknown): SkinProfile {
  if (typeof value !== 'object' || value === null) throw invalid();
  const { skinType, sensitivity, concerns, ingredientsToAvoid } = value as Record<string, unknown>;

  if (!SKIN_TYPES.includes(skinType as SkinType)) throw invalid();
  if (!SKIN_SENSITIVITIES.includes(sensitivity as SkinSensitivity)) throw invalid();
  if (!Array.isArray(concerns) || !concerns.every((item) => SKIN_CONCERNS.includes(item as SkinConcern))) {
    throw invalid();
  }
  if (typeof ingredientsToAvoid !== 'string') throw invalid();

  return {
    skinType: skinType as SkinType,
    sensitivity: sensitivity as SkinSensitivity,
    concerns: concerns as SkinConcern[],
    ingredientsToAvoid,
  };
}

/** The user's Skin Profile. The backend is the source of truth for what was saved. */
export const profileService = {
  /** The saved profile, or `null` for an account that has not saved one yet. */
  async getSkinProfile(): Promise<SkinProfile | null> {
    const response = await apiRequest<ProfileResponse>('/profile/skin');
    const profile = response?.data?.profile;
    if (profile === undefined) throw invalid();
    return profile === null ? null : parseProfile(profile);
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
    return parseProfile(response?.data?.profile);
  },
};
