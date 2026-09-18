export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'notSure';

export type SkinSensitivity = 'sensitive' | 'notSensitive' | 'notSure';

export type SkinConcern = 'acne' | 'excessOil' | 'dryness' | 'redness' | 'acneMarks';

export type SkinProfile = {
  skinType: SkinType;
  sensitivity: SkinSensitivity;
  concerns: SkinConcern[];
  /** Free text, e.g. "Fragrance, alcohol". Empty when none. */
  ingredientsToAvoid: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};
