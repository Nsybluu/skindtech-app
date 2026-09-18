import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { CameraFrame } from '@/components/scan/camera-frame';
import { ScanFlowLayout } from '@/components/scan/scan-flow-layout';
import { ScanNote, ScanNotice } from '@/components/scan/scan-notice';
import { AppButton } from '@/components/ui/app-button';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma 07B — Image Quality Issue. */
export default function ImageQualityScreen() {
  const { t } = useI18n();

  return (
    <ScanFlowLayout
      title={t.imageQuality.title}
      titleVariant="screenTitleSmall"
      preview={
        <CameraFrame
          tone="warning"
          illustrationOpacity={0.55}
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
            textVariant="caption"
            textWeight="semibold"
            // Mock: "another" photo from the gallery passes the quality check.
            onPress={() => router.replace('/photo-review')}
            style={styles.secondary}
          />
          <AppButton
            variant="solid"
            label={t.imageQuality.retake}
            onPress={() => router.back()}
            style={styles.primary}
          />
        </>
      }
    />
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
