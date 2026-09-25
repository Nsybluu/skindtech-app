import type { CareRecommendationContent } from '@/types/recommendation';

/**
 * Guidance shown for DEMO scan results only (the development fallback when the backend cannot be
 * reached). It goes through the same screen as real guidance, but the screen labels it as sample
 * data. A real scan never uses it: its guidance always comes from `GET /scans/:id/recommendation`.
 */
export const demoCareContent: CareRecommendationContent = {
  version: 'rules-v1',
  basedOn: { amount: 'moderate', severity: 'moderate' },
  morningSteps: ['gentle_cleanser', 'lightweight_moisturizer', 'broad_spectrum_sunscreen'],
  eveningSteps: ['gentle_cleanser', 'optional_acne_care_product', 'lightweight_moisturizer'],
  basics: ['gentle_cleanser', 'lightweight_moisturizer', 'non_comedogenic_spf'],
  habits: ['avoid_picking', 'avoid_harsh_scrubs', 'clean_pillowcases_and_phone'],
  professionalHelp: { recommended: false, reasons: ['painful_worsening_or_persistent'] },
  disclaimer: 'general_care_not_diagnosis',
};
