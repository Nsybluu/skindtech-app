import { File } from 'expo-file-system';

import { mockClearScanResult, mockScanResult } from '@/mocks/scan';
import type { SkinProfile } from '@/types/profile';
import type { ScanOutcome, ScanResult } from '@/types/scan';

import { apiRequest } from './api';
import { classifyScanFailure, isConnectivityFailure } from './scan-failure';
import { parseScan } from './scan-history.service';

/**
 * What to do when the SKINDTECH API cannot be reached (offline, services not
 * running, wrong LAN address). `mock` and `clear` keep the flow demonstrable;
 * `off` shows the real failure screen.
 *
 * Set with EXPO_PUBLIC_SCAN_FALLBACK in .env.local. Without it, only
 * development builds fall back: sample data must never reach real users by accident.
 *
 * The fallback only ever replaces *connectivity* failures. A rejected photo, an
 * expired session or a rate limit are real outcomes and are never disguised.
 */
const SCAN_FALLBACKS = ['mock', 'clear', 'off'] as const;
type ScanFallback = (typeof SCAN_FALLBACKS)[number];

function readScanFallback(): ScanFallback {
  const configured = process.env.EXPO_PUBLIC_SCAN_FALLBACK;
  const match = SCAN_FALLBACKS.find((mode) => mode === configured);
  if (match) return match;
  return __DEV__ ? 'mock' : 'off';
}

const SCAN_FALLBACK = readScanFallback();

/**
 * Demo result, clearly flagged so the UI can label it as sample data. Its snapshot is a private
 * copy of the profile that was passed in, so editing the profile later cannot change it either.
 */
function demoResult(photoUri: string, skinProfile: SkinProfile | null): ScanResult {
  const base = SCAN_FALLBACK === 'clear' ? mockClearScanResult : mockScanResult;

  return {
    ...base,
    id: `demo-${Date.now()}`,
    scannedAt: new Date().toISOString(),
    skinProfileSnapshot: skinProfile ? { ...skinProfile, concerns: [...skinProfile.concerns] } : null,
    photoUri,
    isDemoData: true,
  };
}

type CreateScanResponse = {
  status: 'success';
  result: unknown;
};

export const scanService = {
  async analyzePhoto(
    photoUri: string | null,
    skinProfile: SkinProfile | null,
    allowTrainingStorage: boolean,
  ): Promise<ScanOutcome> {
    if (!photoUri) {
      return { status: 'failed', reason: 'image-rejected' };
    }

    try {
      // Reading the file can fail too (deleted, permission revoked), so it
      // belongs inside the same guard as the request.
      const imageFile = new File(photoUri);
      const form = new FormData();
      form.append('image', imageFile, imageFile.name || `scan-${Date.now()}.jpg`);
      if (skinProfile) form.append('skinProfile', JSON.stringify(skinProfile));
      form.append('allowTrainingStorage', String(allowTrainingStorage));

      const response = await apiRequest<CreateScanResponse>('/scans', {
        method: 'POST',
        body: form,
      });
      // The same strict parser as history and detail: a scan without a valid snapshot is an error.
      return {
        status: 'success',
        result: { ...parseScan(response?.result), photoUri },
      };
    } catch (error) {
      const reason = classifyScanFailure(error);
      console.warn('Scan analysis failed', reason, error);

      if (SCAN_FALLBACK !== 'off' && isConnectivityFailure(reason)) {
        console.warn(`Falling back to ${SCAN_FALLBACK} demo data (EXPO_PUBLIC_SCAN_FALLBACK).`);
        return { status: 'success', result: demoResult(photoUri, skinProfile) };
      }

      return { status: 'failed', reason };
    }
  },
};
