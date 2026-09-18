import type { ScanResult } from '@/types/scan';

import { mockScanResult } from './scan';

/** Scan history of the returning demo user (newest first). */
export const mockScanHistory: ScanResult[] = [
  {
    id: 'scan-2026-09-18',
    scannedAt: '2026-09-18T14:32:00',
    ...mockScanResult,
  },
  {
    id: 'scan-2026-09-10',
    scannedAt: '2026-09-10T09:18:00',
    amount: 'mild',
    severity: 'mild',
    detectedTypes: [
      { type: 'comedone', confidence: 0.86, count: 5 },
    ],
    detectionAreas: [
      { id: 'area-1', category: 'comedonal', box: { x: 0.2889, y: 0.25, width: 0.2778, height: 0.1489 } },
      { id: 'area-2', category: 'comedonal', box: { x: 0.4833, y: 0.516, width: 0.2556, height: 0.2021 } },
    ],
  },
  {
    id: 'scan-2026-09-05',
    scannedAt: '2026-09-05T20:05:00',
    amount: 'high',
    severity: 'severe',
    detectedTypes: [
      { type: 'papule', confidence: 0.9, count: 9 },
      { type: 'pustule', confidence: 0.88, count: 5 },
      { type: 'nodule', confidence: 0.79, count: 2 },
    ],
    detectionAreas: [
      { id: 'area-1', category: 'inflammatory', box: { x: 0.2889, y: 0.25, width: 0.2778, height: 0.1489 } },
      { id: 'area-2', category: 'inflammatory', box: { x: 0.1556, y: 0.4415, width: 0.3, height: 0.234 } },
      { id: 'area-3', category: 'inflammatory', box: { x: 0.4833, y: 0.516, width: 0.2556, height: 0.2021 } },
    ],
  },
];
