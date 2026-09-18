import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AiConsentSheet } from '@/components/scan/ai-consent-sheet';
import { CameraFrame } from '@/components/scan/camera-frame';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { ScanNote, ScanNotice } from '@/components/scan/scan-notice';
import { AppButton } from '@/components/ui/app-button';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';

/** Figma 07A — Photo Review, with the 07A.1 AI consent sheet on first use. */
export default function PhotoReviewScreen() {
  const { t } = useI18n();
  const { aiImprovementConsent, pendingPhotoUri, setAiImprovementConsent, setPendingPhotoUri } = useUserData();
  const [consentVisible, setConsentVisible] = useState(false);

  if (!pendingPhotoUri) {
    return <Redirect href="/scan" />;
  }

  const startAnalysis = () => router.replace('/analyzing');

  const usePhoto = () => {
    if (aiImprovementConsent === null) {
      setConsentVisible(true);
    } else {
      startAnalysis();
    }
  };

  const answerConsent = (allowed: boolean) => {
    setAiImprovementConsent(allowed);
    setConsentVisible(false);
    startAnalysis();
  };

  return (
    <>
      <ScanFlowLayout
        title={t.photoReview.title}
        preview={
          <CameraFrame
            photoUri={pendingPhotoUri}
            guidanceTitle={t.photoReview.guidanceTitle}
            guidanceBody={t.photoReview.guidanceBody}
          />
        }
        controls={
          <>
            <ScanNotice message={t.photoReview.notice} />
            <ScanNote message={t.photoReview.note} />
          </>
        }
        actions={
          <>
            <AppButton
              variant="secondary"
              label={t.photoReview.retake}
              onPress={() => {
                setPendingPhotoUri(null);
                router.back();
              }}
              style={styles.secondary}
            />
            <AppButton variant="solid" label={t.photoReview.usePhoto} onPress={usePhoto} style={styles.primary} />
          </>
        }
      />

      <AiConsentSheet
        visible={consentVisible}
        onClose={() => setConsentVisible(false)}
        onDecline={() => answerConsent(false)}
        onAllow={() => answerConsent(true)}
        onLearnMore={() => {
          setConsentVisible(false);
          router.push('/privacy');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  secondary: {
    width: 104,
  },
  primary: {
    flex: 1,
  },
});
