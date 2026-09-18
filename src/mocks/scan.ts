import type { AcneDetectionArea, ScanResult } from '@/types/scan';

/**
 * UI demo data only — not a medical assessment.
 *
 * Later this shape will be produced by: React Native → Express → FastAPI → YOLO.
 */

/**
 * Detection areas traced from the Figma "Overlay / Detected Acne Areas" layer.
 * Boxes are normalised to the photo (0–1), so they scale with any image size.
 */
export const mockDetectionAreas: AcneDetectionArea[] = [
  { id: 'area-1', category: 'comedonal', box: { x: 0.2889, y: 0.25, width: 0.2778, height: 0.1489 } },
  { id: 'area-2', category: 'inflammatory', box: { x: 0.1556, y: 0.4415, width: 0.3, height: 0.234 } },
  { id: 'area-3', category: 'comedonal', box: { x: 0.4833, y: 0.516, width: 0.2556, height: 0.2021 } },
];

export const mockScanResult: Omit<ScanResult, 'id' | 'scannedAt'> = {
  amount: 'moderate',
  severity: 'moderate',
  detectedTypes: [
    { type: 'papule', confidence: 0.91, count: 6 },
    { type: 'pustule', confidence: 0.87, count: 3 },
    { type: 'comedone', confidence: 0.83, count: 4 },
  ],
  detectionAreas: mockDetectionAreas,
};

/** Figma 08A — no visible acne. */
export const mockClearScanResult: Omit<ScanResult, 'id' | 'scannedAt'> = {
  amount: 'none',
  severity: 'none',
  detectedTypes: [],
  detectionAreas: [],
};

/**
 * Outcomes returned by the mock analysis, in order, so every Figma state can be
 * demonstrated: 1st scan → result with acne, 2nd → no visible acne,
 * 3rd → analysis failed, then it starts over.
 */
export const MOCK_ANALYSIS_OUTCOMES = ['acne', 'clear', 'failed'] as const;

export type MockAnalysisOutcome = (typeof MOCK_ANALYSIS_OUTCOMES)[number];

/** Total mock analysis time; the progress card steps through evenly. */
export const MOCK_ANALYSIS_DURATION_MS = 3500;
