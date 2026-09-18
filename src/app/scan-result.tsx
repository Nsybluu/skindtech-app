import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import InfoIcon from '@/assets/icons/info.svg';
import { AcneTypesSection } from '@/components/result/acne-types-section';
import { DetectedAreasCard } from '@/components/result/detected-areas-card';
import { OverallAnalysisCard } from '@/components/result/overall-analysis-card';
import { SkinProfileSummary } from '@/components/scan/skin-profile-summary';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { formatScanDate, getDetectedCategories } from '@/utils/format';

/** Figma 08 — Scan Result (and 08A when nothing was detected). */
export default function ScanResultScreen() {
  const { t, language } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getScanResult, scanHistory } = useUserData();

  const result = id ? getScanResult(id) : scanHistory[0];

  if (!result) {
    return (
      <AppScreen header={<ScreenHeader title={t.result.title} gap={Spacing.m} />}>
        <AppText variant="body" color={Colors.text.secondary}>
          {t.result.notFound}
        </AppText>
      </AppScreen>
    );
  }

  const categories = getDetectedCategories(result);
  const isClear = result.amount === 'none';

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t.result.title}
          gap={Spacing.m}
          accessory={
            <AppText variant="caption" color={Colors.text.muted} style={styles.date}>
              {formatScanDate(result.scannedAt, {
                language,
                todayLabel: t.result.today,
                relative: true,
              })}
            </AppText>
          }
        />
      }
      footer={
        <ActionBar>
          <AppButton
            variant="secondary"
            label={t.common.scanAgain}
            onPress={() => router.dismissTo('/scan')}
            style={styles.secondary}
          />
          <AppButton
            variant="solid"
            label={isClear ? t.result.basicCareTips : t.result.careRecommendations}
            onPress={() => router.push({ pathname: '/recommendation', params: { id: result.id } })}
            style={styles.primary}
          />
        </ActionBar>
      }>
      <OverallAnalysisCard result={result} />
      <DetectedAreasCard result={result} categories={categories} />
      <AcneTypesSection categories={categories} />
      <SkinProfileSummary variant="result" />
      <Notice
        icon={<InfoIcon />}
        message={
          result.isDemoData
            ? t.result.demoDisclaimer
            : isClear
              ? t.result.clearDisclaimer
              : t.result.disclaimer
        }
        messageVariant="caption"
        style={styles.notice}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  date: {
    marginRight: Spacing.l,
  },
  notice: {
    minHeight: 48,
    paddingHorizontal: Spacing.m,
    borderRadius: Radius.m,
  },
  secondary: {
    width: 104,
  },
  primary: {
    flex: 1,
  },
});
