import {
  ACNE_AMOUNTS,
  ACNE_CATEGORIES,
  ACNE_LESION_TYPES,
  SEVERITIES,
  type AcneAmount,
  type AcneCategory,
  type AcneDetectionArea,
  type AcneLesionType,
  type DetectedAcneType,
  type ScanResult,
  type Severity,
} from '@/types/scan';

import { apiRequest } from './api';
import { ApiError } from './api-error';
import { invalidResponse, isNumber, isRecord, oneOf } from './response-guards';
import { parseSkinProfile } from './skin-profile-parser';

export const HISTORY_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
/** Most scans one `DELETE /scans/selection` request may name (the backend rejects more). */
export const MAX_DELETE_SELECTION = 50;

export type ScanPage = {
  scans: ScanResult[];
  /** Opaque cursor for the next (older) page, `null` on the last page. */
  nextCursor: string | null;
};

type ListResponse = { status: 'success'; data: { scans: unknown; nextCursor: unknown } };
type DetailResponse = { status: 'success'; data: { scan: unknown } };

const invalid = invalidResponse;

function parseDetectedType(value: unknown): DetectedAcneType {
  if (!isRecord(value)) throw invalid();
  const { type, confidence, count } = value;
  if (!isNumber(confidence) || confidence < 0 || confidence > 1) throw invalid();
  if (!isNumber(count) || !Number.isInteger(count) || count < 0) throw invalid();
  return { type: oneOf<AcneLesionType>(ACNE_LESION_TYPES, type), confidence, count };
}

function parseDetectionArea(value: unknown): AcneDetectionArea {
  if (!isRecord(value)) throw invalid();
  const { id, category, box } = value;
  if (typeof id !== 'string' || id === '') throw invalid();
  if (!isRecord(box)) throw invalid();
  const { x, y, width, height } = box;
  if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height)) throw invalid();
  if (width < 0 || height < 0) throw invalid();
  return { id, category: oneOf<AcneCategory>(ACNE_CATEGORIES, category), box: { x, y, width, height } };
}

/**
 * Accepts only a well-formed scan and copies just the known fields. Anything else is an
 * error, so a malformed answer can never be shown as (or mistaken for) an empty history.
 * There is deliberately no `photoUri`: the backend never returns photos, and the training
 * images kept in R2 are never shown back to the user.
 *
 * `skinProfileSnapshot` must be present: `null` is a valid answer ("no profile was saved"), but a
 * missing or malformed one is an error, never silently turned into `null`.
 */
export function parseScan(value: unknown): ScanResult {
  if (!isRecord(value)) throw invalid();
  const { id, scannedAt, modelVersion, image, amount, severity, detectedTypes, detectionAreas } = value;
  const snapshot = value.skinProfileSnapshot;
  if (snapshot === undefined) throw invalid();

  if (typeof id !== 'string' || id === '') throw invalid();
  if (typeof scannedAt !== 'string' || Number.isNaN(Date.parse(scannedAt))) throw invalid();
  if (modelVersion != null && typeof modelVersion !== 'string') throw invalid();
  if (!Array.isArray(detectedTypes) || !Array.isArray(detectionAreas)) throw invalid();

  let imageSize: ScanResult['image'];
  if (image != null) {
    if (!isRecord(image) || !isNumber(image.width) || !isNumber(image.height)) throw invalid();
    if (image.width <= 0 || image.height <= 0) throw invalid();
    imageSize = { width: image.width, height: image.height };
  }

  return {
    id,
    scannedAt,
    ...(typeof modelVersion === 'string' ? { modelVersion } : {}),
    ...(imageSize ? { image: imageSize } : {}),
    skinProfileSnapshot: snapshot === null ? null : parseSkinProfile(snapshot),
    amount: oneOf<AcneAmount>(ACNE_AMOUNTS, amount),
    severity: oneOf<Severity>(SEVERITIES, severity),
    detectedTypes: detectedTypes.map(parseDetectedType),
    detectionAreas: detectionAreas.map(parseDetectionArea),
  };
}

function pageSize(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return HISTORY_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(limit)));
}

/** The user's saved scans. The backend is the source of truth; nothing here touches local state. */
export const scanHistoryService = {
  /** One page, newest first. Throws (never returns an empty page) when the answer is malformed. */
  async listScans(options: { limit?: number; cursor?: string | null } = {}): Promise<ScanPage> {
    const query = [`limit=${pageSize(options.limit)}`];
    // The cursor is opaque base64url, but it is still user-controlled input for a URL.
    if (options.cursor) query.push(`cursor=${encodeURIComponent(options.cursor)}`);

    const response = await apiRequest<ListResponse>(`/scans?${query.join('&')}`);
    const data = response?.data;
    if (!isRecord(data) || !Array.isArray(data.scans)) throw invalid();

    const { nextCursor } = data;
    if (nextCursor !== null && (typeof nextCursor !== 'string' || nextCursor === '')) throw invalid();

    return { scans: data.scans.map(parseScan), nextCursor };
  },

  /** One scan by id. A missing or foreign scan is `ApiError(404, 'SCAN_NOT_FOUND')`. */
  async getScan(id: string): Promise<ScanResult> {
    const response = await apiRequest<DetailResponse>(`/scans/${encodeURIComponent(id)}`);
    const scan = parseScan(response?.data?.scan);
    // An answer about another scan than the one asked for is not an answer.
    if (scan.id.toLowerCase() !== id.toLowerCase()) throw invalid();
    return scan;
  },

  /**
   * Deletes the named scans (and their consented training images) on the backend, all or
   * nothing: one unknown or foreign id makes the whole request fail with `SCAN_NOT_FOUND`.
   * Resolves only after the backend confirmed with 204.
   */
  async deleteScans(ids: string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0 || unique.length > MAX_DELETE_SELECTION) {
      // The backend would refuse it too; do not even send it.
      throw new ApiError(400, 'VALIDATION_ERROR');
    }
    await apiRequest<void>('/scans/selection', {
      method: 'DELETE',
      body: JSON.stringify({ ids: unique }),
    });
  },

  /**
   * Deletes every saved scan (and any consented training image) on the backend. Resolves
   * only after the backend confirmed with 204; callers must not clear local data before that.
   */
  async deleteHistory(): Promise<void> {
    await apiRequest<void>('/scans', { method: 'DELETE' });
  },
};
