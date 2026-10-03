import { router } from 'expo-router';

import { CameraFrame } from '@/components/scan/camera-frame';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { ScanNote, ScanNotice } from '@/components/scan/scan-notice';
import { AppButton } from '@/components/ui/app-button';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';

/** Figma 07B — Image Quality Issue. Reached when the AI service refuses the photo. */
export default function ImageQualityScreen() {
  const { t } = useI18n();
  const { pendingPhotoUri, setPendingPhotoUri } = useUserData();

  const backToScan = (params?: { pick: string }) => {
    setPendingPhotoUri(null);
    router.dismissTo(params ? { pathname: '/scan', params } : '/scan');
  };

  return (
    <ScanFlowLayout
      title={t.imageQuality.title}
      onBack={() => backToScan()}
      preview={
        <CameraFrame
          tone="warning"
          photoUri={pendingPhotoUri}
          dimmed
          guidanceTitle={t.imageQuality.warningTitle}
          guidanceBody={t.imageQuality.warningBody}
        />
      }
      controls={
        <>
          <ScanNotice message={t.imageQuality.notice} />
          <ScanNote message={t.imageQuality.note} />
        </>
      }
      actions={
        <>
          <AppButton
            variant="secondary"
            label={t.imageQuality.chooseAnother}
            // A fresh `pick` value makes the Scan screen open the photo library.
            onPress={() => backToScan({ pick: String(Date.now()) })}
            className="w-[132px]"
          />
          <AppButton
            variant="solid"
            label={t.imageQuality.retake}
            onPress={() => backToScan()}
            className="flex-1"
          />
        </>
      }
    />
  );
}
