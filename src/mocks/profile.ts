import type { SkinProfile } from '@/types/profile';

/** Skin Profile of the returning demo user (matches the Figma "My Skin Profile" state). */
export const mockSkinProfile: SkinProfile = {
  skinType: 'oily',
  sensitivity: 'sensitive',
  concerns: ['acne', 'excessOil'],
  ingredientsToAvoid: '',
};
