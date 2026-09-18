/**
 * Scan domain types.
 *
 * Shaped after what the YOLO pipeline is expected to return later
 * (React Native → Express → FastAPI/YOLO), but currently filled with mock data.
 */

export type Severity = 'none' | 'mild' | 'moderate' | 'severe';

export type AcneAmount = 'none' | 'mild' | 'moderate' | 'high';

/** Individual lesion classes the detection model can output. */
export type AcneLesionType = 'comedone' | 'papule' | 'pustule' | 'nodule';

/** Groups shown in the UI ("Comedonal acne", "Inflammatory acne"). */
export type AcneCategory = 'comedonal' | 'inflammatory';

export type DetectedAcneType = {
  type: AcneLesionType;
  /** 0–1 model confidence */
  confidence: number;
  count: number;
};

/** Bounding box normalised to the image (0–1 on both axes). */
export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AcneDetectionArea = {
  id: string;
  category: AcneCategory;
  box: NormalizedBox;
};

export type ScanResult = {
  id: string;
  /** ISO 8601 timestamp */
  scannedAt: string;
  modelVersion?: string;
  /** True when the result came from the offline demo fallback, not the AI service. */
  isDemoData?: boolean;
  /** Local device URI; the inference service does not persist the photo. */
  photoUri?: string;
  image?: { width: number; height: number };
  amount: AcneAmount;
  severity: Severity;
  detectedTypes: DetectedAcneType[];
  detectionAreas: AcneDetectionArea[];
};

export type ScanOutcome =
  | { status: 'success'; result: ScanResult }
  | { status: 'failed' };
