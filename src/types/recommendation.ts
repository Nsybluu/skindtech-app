/**
 * Care recommendation of a scan, as `GET /scans/:id/recommendation` returns it.
 *
 * Everything the backend says about *what to do* is a semantic key: the app owns the wording
 * (English and Thai), so the same recommendation reads the same in either language.
 */

import type { AcneAmount, Severity } from './scan';

export const CARE_STEPS = [
  'gentle_cleanser',
  'lightweight_moisturizer',
  'broad_spectrum_sunscreen',
  'optional_acne_care_product',
] as const;
export type CareStep = (typeof CARE_STEPS)[number];

export const CARE_BASICS = ['gentle_cleanser', 'lightweight_moisturizer', 'non_comedogenic_spf'] as const;
export type CareBasic = (typeof CARE_BASICS)[number];

export const CARE_HABITS = ['avoid_picking', 'avoid_harsh_scrubs', 'clean_pillowcases_and_phone'] as const;
export type CareHabit = (typeof CARE_HABITS)[number];

export const PROFESSIONAL_HELP_REASONS = [
  'severe_pattern',
  'nodules_detected',
  'painful_worsening_or_persistent',
] as const;
export type ProfessionalHelpReason = (typeof PROFESSIONAL_HELP_REASONS)[number];

export const RECOMMENDATION_SOURCES = ['rules', 'llm'] as const;
export type RecommendationSource = (typeof RECOMMENDATION_SOURCES)[number];

export const RECOMMENDATION_VERSIONS = ['rules-v1', 'rules-v1+llm-v1'] as const;
export type RecommendationVersion = (typeof RECOMMENDATION_VERSIONS)[number];

export const CARE_DISCLAIMERS = ['general_care_not_diagnosis'] as const;
export type CareDisclaimer = (typeof CARE_DISCLAIMERS)[number];

/** Free text the backend generated in both languages; the app shows the one that matches its own. */
export type LocalizedText = { en: string; th: string };

/** Optional extra guidance from the language model. Never replaces the rules-based guidance. */
export type CarePersonalization = {
  summary: LocalizedText;
  tips: LocalizedText[];
};

export type CareRecommendationContent = {
  version: RecommendationVersion;
  basedOn: { amount: AcneAmount; severity: Severity };
  morningSteps: CareStep[];
  eveningSteps: CareStep[];
  basics: CareBasic[];
  habits: CareHabit[];
  professionalHelp: {
    recommended: boolean;
    reasons: ProfessionalHelpReason[];
  };
  disclaimer: CareDisclaimer;
  personalization?: CarePersonalization;
};

export type CareRecommendation = {
  id: string;
  scanId: string;
  source: RecommendationSource;
  content: CareRecommendationContent;
  /** ISO 8601 */
  createdAt: string;
};
