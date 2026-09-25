import {
  SKIN_CONCERNS,
  SKIN_SENSITIVITIES,
  SKIN_TYPES,
  type SkinProfile,
} from '@/types/profile';

import { arrayOf, invalidResponse, isRecord, oneOf } from './response-guards';

/**
 * Accepts only a well-formed Skin Profile and copies just the known fields. Anything else is an
 * `INVALID_RESPONSE` error, so a malformed answer can never be mistaken for a saved profile
 * (or for "no profile"). Used for `/profile/skin` and for the snapshot inside every scan.
 */
export function parseSkinProfile(value: unknown): SkinProfile {
  if (!isRecord(value)) throw invalidResponse();
  const { skinType, sensitivity, concerns, ingredientsToAvoid } = value;
  if (typeof ingredientsToAvoid !== 'string') throw invalidResponse();

  return {
    skinType: oneOf(SKIN_TYPES, skinType),
    sensitivity: oneOf(SKIN_SENSITIVITIES, sensitivity),
    concerns: arrayOf(SKIN_CONCERNS, concerns, { allowEmpty: true }),
    ingredientsToAvoid,
  };
}
