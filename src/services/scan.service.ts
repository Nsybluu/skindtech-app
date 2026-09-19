import { File } from 'expo-file-system';

import { mockClearScanResult, mockScanResult } from '@/mocks/scan';
import type { SkinProfile } from '@/types/profile';
import type { ScanOutcome, ScanResult } from '@/types/scan';

import { apiRequest, mockResponse } from './api';

/**
 * What to do when the SKINDTECH API cannot be reached (offline, services not
 * running, wrong LAN address). `mock` and `clear` keep the flow demonstrable;
 * `off` surfaces the real failure screen.
 *
 * Set with EXPO_PUBLIC_SCAN_FALLBACK in .env.local.
 */
type ScanFallback = 'mock' | 'clear' | 'off';

const SCAN_FALLBACK = (process.env.EXPO_PUBLIC_SCAN_FALLBACK ?? 'mock') as ScanFallback;

/** Demo result, clearly flagged so the UI can label it as sample data. */
function demoResult(photoUri: string): ScanResult {
  const base = SCAN_FALLBACK === 'clear' ? mockClearScanResult : mockScanResult;

  return {
    ...base,
    id: `demo-${Date.now()}`,
    scannedAt: new Date().toISOString(),
    photoUri,
    isDemoData: true,
  };
}

type CreateScanResponse = {
  status: 'success';
  result: ScanResult;
};

export const scanService = {
  async analyzePhoto(
    photoUri: string | null,
    skinProfile: SkinProfile | null,
    allowTrainingStorage: boolean,
  ): Promise<ScanOutcome> {
    if (!photoUri) {
      return { status: 'failed' };
    }

    const imageFile = new File(photoUri);
    const form = new FormData();
    form.append('image', imageFile, imageFile.name || `scan-${Date.now()}.jpg`);
    if (skinProfile) form.append('skinProfile', JSON.stringify(skinProfile));
    form.append('allowTrainingStorage', String(allowTrainingStorage));

    try {
      const response = await apiRequest<CreateScanResponse>('/scans', {
        method: 'POST',
        body: form,
      });
      return {
        status: 'success',
        result: { ...response.result, photoUri },
      };
    } catch (error) {
      console.warn('Scan analysis failed', error);

      if (SCAN_FALLBACK !== 'off') {
        console.warn(`Falling back to ${SCAN_FALLBACK} demo data (EXPO_PUBLIC_SCAN_FALLBACK).`);
        return { status: 'success', result: demoResult(photoUri) };
      }

      return { status: 'failed' };
    }
  },

  deleteHistory() {
    return mockResponse(undefined);
  },
};
