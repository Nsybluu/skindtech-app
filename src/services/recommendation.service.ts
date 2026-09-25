import { ACNE_AMOUNTS, SEVERITIES } from '@/types/scan';
import {
  CARE_BASICS,
  CARE_DISCLAIMERS,
  CARE_HABITS,
  CARE_STEPS,
  PROFESSIONAL_HELP_REASONS,
  RECOMMENDATION_SOURCES,
  RECOMMENDATION_VERSIONS,
  type CarePersonalization,
  type CareRecommendation,
  type CareRecommendationContent,
  type LocalizedText,
} from '@/types/recommendation';

import { apiRequest } from './api';
import { arrayOf, invalidResponse, isNonBlankString, isRecord, oneOf } from './response-guards';

type RecommendationResponse = {
  status: 'success';
  data: { recommendation: unknown };
};

/** Generous upper bounds: the backend keeps each text under 280, these only stop absurd answers. */
const MAX_TEXT_LENGTH = 1_000;
const MAX_TIPS = 10;

function parseLocalizedText(value: unknown): LocalizedText {
  if (!isRecord(value)) throw invalidResponse();
  const { en, th } = value;
  // Blank text is not guidance: it would render as an empty line under a real heading.
  if (!isNonBlankString(en) || !isNonBlankString(th)) throw invalidResponse();
  if (en.length > MAX_TEXT_LENGTH || th.length > MAX_TEXT_LENGTH) throw invalidResponse();
  return { en: en.trim(), th: th.trim() };
}

function parsePersonalization(value: unknown): CarePersonalization {
  if (!isRecord(value)) throw invalidResponse();
  const { summary, tips } = value;
  if (!Array.isArray(tips) || tips.length === 0 || tips.length > MAX_TIPS) throw invalidResponse();
  return { summary: parseLocalizedText(summary), tips: tips.map(parseLocalizedText) };
}

function parseContent(value: unknown): CareRecommendationContent {
  if (!isRecord(value)) throw invalidResponse();
  const { version, basedOn, morningSteps, eveningSteps, basics, habits, professionalHelp, disclaimer, personalization } = value;

  if (!isRecord(basedOn) || !isRecord(professionalHelp)) throw invalidResponse();
  if (typeof professionalHelp.recommended !== 'boolean') throw invalidResponse();

  return {
    version: oneOf(RECOMMENDATION_VERSIONS, version),
    basedOn: { amount: oneOf(ACNE_AMOUNTS, basedOn.amount), severity: oneOf(SEVERITIES, basedOn.severity) },
    morningSteps: arrayOf(CARE_STEPS, morningSteps),
    eveningSteps: arrayOf(CARE_STEPS, eveningSteps),
    basics: arrayOf(CARE_BASICS, basics),
    habits: arrayOf(CARE_HABITS, habits),
    professionalHelp: {
      recommended: professionalHelp.recommended,
      reasons: arrayOf(PROFESSIONAL_HELP_REASONS, professionalHelp.reasons, { allowEmpty: true }),
    },
    disclaimer: oneOf(CARE_DISCLAIMERS, disclaimer),
    // Optional: absent means "rules only". Present but malformed is an error, never "absent".
    ...(personalization === undefined || personalization === null
      ? {}
      : { personalization: parsePersonalization(personalization) }),
  };
}

/**
 * Accepts only a well-formed recommendation for the scan that was asked for. Every key must be
 * one the app can translate, so nothing raw or unknown ever reaches the screen.
 */
export function parseRecommendation(value: unknown, requestedScanId: string): CareRecommendation {
  if (!isRecord(value)) throw invalidResponse();
  const { id, scanId, source, content, createdAt } = value;

  if (!isNonBlankString(id)) throw invalidResponse();
  // An answer about another scan than the one asked for is not an answer.
  if (typeof scanId !== 'string' || scanId.toLowerCase() !== requestedScanId.toLowerCase()) throw invalidResponse();
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt))) throw invalidResponse();

  return {
    id,
    scanId,
    source: oneOf(RECOMMENDATION_SOURCES, source),
    content: parseContent(content),
    createdAt,
  };
}

/** The care recommendation the backend stored for one scan. Read-only: a GET with no body. */
export const recommendationService = {
  /** Throws `ApiError`: 404 `RECOMMENDATION_NOT_FOUND`, 401, network, or `INVALID_RESPONSE`. */
  async getRecommendation(scanId: string): Promise<CareRecommendation> {
    const response = await apiRequest<RecommendationResponse>(`/scans/${encodeURIComponent(scanId)}/recommendation`);
    return parseRecommendation(response?.data?.recommendation, scanId);
  },
};
