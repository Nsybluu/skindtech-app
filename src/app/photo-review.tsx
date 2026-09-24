import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

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
  const { aiImprovementConsent, isSavingConsent, pendingPhotoUri, saveAiConsent, setPendingPhotoUri } = useUserData();
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

  // The choice is saved on the backend first. Only a confirmed answer closes the sheet and
  // starts the scan, so a failed request can never turn into consent (or into a silent decline).
  const answerConsent = async (allowed: boolean) => {
    try {
      const confirmed = await saveAiConsent(allowed);
      if (confirmed === null) return; // another answer is still being saved
      setConsentVisible(false);
      startAnalysis();
    } catch {
      Alert.alert(t.consent.saveFailedTitle, t.consent.saveFailedBody, [{ text: t.common.ok }]);
    }
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
        busy={isSavingConsent}
        onClose={() => setConsentVisible(false)}
        onDecline={() => void answerConsent(false)}
        onAllow={() => void answerConsent(true)}
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
