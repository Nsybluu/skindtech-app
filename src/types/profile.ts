export const SKIN_TYPES = ['oily', 'dry', 'combination', 'normal', 'notSure'] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

export const SKIN_SENSITIVITIES = ['sensitive', 'notSensitive', 'notSure'] as const;
export type SkinSensitivity = (typeof SKIN_SENSITIVITIES)[number];

export const SKIN_CONCERNS = ['acne', 'excessOil', 'dryness', 'redness', 'acneMarks'] as const;
export type SkinConcern = (typeof SKIN_CONCERNS)[number];

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
