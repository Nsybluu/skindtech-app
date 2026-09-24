import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AnalysisProgressCard } from '@/components/scan/analysis-progress-card';
import { CameraFrame } from '@/components/scan/camera-frame';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { scanService } from '@/services/scan.service';
import type { ScanFailureReason } from '@/types/scan';

const PROGRESS_INTERVAL_MS = 850;

/** Where each failure sends the user; `null` means the auth guard already took over. */
function failureRoute(reason: ScanFailureReason) {
  switch (reason) {
    case 'image-rejected':
      return '/image-quality' as const;
    case 'session':
      // The session could not be refreshed and the user is being signed out.
      return null;
    default:
      return '/analysis-failed' as const;
  }
}

/** Figma 07C — Analyzing. Uploads the selected image to the SKINDTECH API. */
export default function AnalyzingScreen() {
  const { t } = useI18n();
  const { getAiImprovementConsent, pendingPhotoUri, skinProfile, addScanResult } = useUserData();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = t.analyzing.steps.length;

  useEffect(() => {
    let cancelled = false;

    const stepInterval = setInterval(
      () => setCurrentStep((step) => Math.min(step + 1, totalSteps)),
      PROGRESS_INTERVAL_MS,
    );

    scanService
      // Only a backend-confirmed `true` lets the photo be kept; unknown or declined never does.
      .analyzePhoto(pendingPhotoUri, skinProfile, getAiImprovementConsent() === true)
      .then((outcome) => {
        if (cancelled) return;
        if (outcome.status === 'success') {
          addScanResult(outcome.result);
          router.replace({ pathname: '/scan-result', params: { id: outcome.result.id } });
          return;
        }

        const destination = failureRoute(outcome.reason);
        if (destination) router.replace(destination);
      })
      .catch(() => {
        // analyzePhoto reports failures as outcomes; this only guards against
        // an unexpected throw leaving the user on the progress screen forever.
        if (!cancelled) router.replace('/analysis-failed');
      });

    return () => {
      cancelled = true;
      clearInterval(stepInterval);
    };
    // Run the analysis once per visit to this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScanFlowLayout
      title={t.analyzing.title}
      preview={
        <CameraFrame
          photoUri={pendingPhotoUri}
          guidanceTitle={t.analyzing.guidanceTitle}
          guidanceBody={t.analyzing.guidanceBody}
        />
      }
      controls={<AnalysisProgressCard currentStep={currentStep} />}
    />
  );
}
