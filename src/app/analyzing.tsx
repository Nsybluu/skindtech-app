import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { AnalysisProgressCard } from '@/components/scan/analysis-progress-card';
import { CameraFrame } from '@/components/scan/camera-frame';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { scanService } from '@/services/scan.service';

const PROGRESS_INTERVAL_MS = 850;

/** Figma 07C — Analyzing. Uploads the selected image to the SKINDTECH API. */
export default function AnalyzingScreen() {
  const { t } = useI18n();
  const { aiImprovementConsent, pendingPhotoUri, skinProfile, addScanResult } = useUserData();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = t.analyzing.steps.length;

  useEffect(() => {
    let cancelled = false;

    const stepInterval = setInterval(
      () => setCurrentStep((step) => Math.min(step + 1, totalSteps)),
      PROGRESS_INTERVAL_MS,
    );

    scanService.analyzePhoto(pendingPhotoUri, skinProfile, aiImprovementConsent === true).then((outcome) => {
      if (cancelled) return;
      if (outcome.status === 'success') {
        addScanResult(outcome.result);
        router.replace({ pathname: '/scan-result', params: { id: outcome.result.id } });
      } else {
        router.replace('/analysis-failed');
      }
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
          illustrationOpacity={0.7}
          guidanceTitle={t.analyzing.guidanceTitle}
          guidanceBody={t.analyzing.guidanceBody}
        />
      }
      controls={<AnalysisProgressCard currentStep={currentStep} />}
    />
  );
}
