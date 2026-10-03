import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { CareSection } from '@/components/care/care-section';
import { AcneTypesSection } from '@/components/result/acne-types-section';
import { DetectedAreasCard } from '@/components/result/detected-areas-card';
import { OverallAnalysisCard } from '@/components/result/overall-analysis-card';
import { ScanActionsSheet } from '@/components/result/scan-actions-sheet';
import { SkinProfileSnapshotCard } from '@/components/result/skin-profile-snapshot-card';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconButton } from '@/components/ui/icon-button';
import { EllipsisIcon, InfoIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { goBackOr, ScreenHeader } from '@/components/ui/screen-header';
import { StateCard } from '@/components/ui/state-card';
import { Colors } from '@/constants/colors';
import { useRecommendation } from '@/hooks/use-recommendation';
import { useScanResult } from '@/hooks/use-scan-result';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { dataErrorMessage, dataErrorMessageForKind } from '@/utils/data-errors';
import { recommendationTarget } from '@/utils/recommendation-target';
import { formatScanDate, getDetectedCategories } from '@/utils/format';

/**
 * Figma 08 — Scan Result (and 08A when nothing was detected), now with the basic care guidance
 * below the analysis. One screen for a scan that was just made and for one opened from history
 * or a link: it shows the scan from memory, or loads it from the backend.
 */
export default function ScanResultScreen() {
  const { t, language } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { history } = useUserData();
  const state = useScanResult(id);
  // The scan above is complete on its own; its care guidance loads next to it and fails on its own.
  // A demo scan never reached the backend, so it asks for nothing.
  const recommendation = useRecommendation(recommendationTarget(state.status === 'ready' ? state.result : undefined));
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Set once the scan was deleted and the screen is on its way out, so it does not flash "not found".
  const [leaving, setLeaving] = useState(false);

  if (leaving) return <AppScreen>{null}</AppScreen>;

  if (state.status !== 'ready') {
    return (
      <AppScreen header={<ScreenHeader title={t.result.title} className="gap-3" />}>
        {state.status === 'loading' ? (
          <StateCard loading title={t.result.loadingResult} />
        ) : state.status === 'not-found' ? (
          <StateCard
            icon={<AppIcon icon={InfoIcon} size={22} />}
            title={t.result.notFound}
            actionLabel={t.common.back}
            onAction={() => router.back()}
          />
        ) : (
          <StateCard
            icon={<AppIcon icon={InfoIcon} size={22} />}
            title={t.result.loadFailedTitle}
            body={dataErrorMessageForKind(state.kind, t)}
            // A dead session is being signed out already: retrying would not help.
            actionLabel={state.kind === 'session' ? undefined : t.common.retry}
            onAction={state.retry}
          />
        )}
      </AppScreen>
    );
  }

  const { result } = state;
  const categories = getDetectedCategories(result);
  const isClear = result.amount === 'none';
  // Sample data from the offline demo fallback never reached the backend, so there is nothing to delete.
  const canDelete = !result.isDemoData;

  const closeMenu = () => {
    setDeleteError(null);
    setMenuOpen(false);
  };

  const deleteThisScan = async () => {
    setDeleteError(null);
    try {
      // The screen stays as it is until the backend confirmed the deletion.
      if (await history.deleteSelected([result.id])) {
        setLeaving(true);
        setMenuOpen(false);
        goBackOr(() => router.replace('/scan-history'));
      } else {
        setDeleteError(t.dataErrors.historyNotReady);
      }
    } catch (error) {
      setDeleteError(dataErrorMessage(error, t));
    }
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t.result.title}
          className="gap-3"
          accessory={
            canDelete ? (
              <IconButton accessibilityLabel={t.result.moreOptions} onPress={() => setMenuOpen(true)}>
                <AppIcon icon={EllipsisIcon} size={18} color={Colors.text.muted} strokeWidth={2} />
              </IconButton>
            ) : undefined
          }
        />
      }
      footer={
        <ActionBar>
          <AppButton
            variant="solid"
            label={t.common.scanAgain}
            onPress={() => router.dismissTo('/scan')}
            className="flex-1"
          />
        </ActionBar>
      }>
      <AppText variant="caption" className="text-fg-muted">
        {formatScanDate(result.scannedAt, {
          language,
          todayLabel: t.result.today,
          relative: true,
        })}
      </AppText>
      <OverallAnalysisCard result={result} />
      <DetectedAreasCard result={result} categories={categories} />
      <AcneTypesSection categories={categories} />
      <SkinProfileSnapshotCard snapshot={result.skinProfileSnapshot} />
      <CareSection isDemo={result.isDemoData === true} state={recommendation.state} onRetry={recommendation.retry} />
      <Notice
        icon={<AppIcon icon={InfoIcon} size={18} />}
        message={
          result.isDemoData
            ? t.result.demoDisclaimer
            : isClear
              ? t.result.clearDisclaimer
              : t.result.disclaimer
        }
        className="min-h-12 rounded-md px-3"
      />
      <ScanActionsSheet
        visible={menuOpen}
        busy={history.deleting}
        error={deleteError}
        onDelete={() => void deleteThisScan()}
        onClose={closeMenu}
      />
    </AppScreen>
  );
}
