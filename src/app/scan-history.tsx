import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { DeleteScansSheet, type DeleteScansTarget } from '@/components/history/delete-scans-sheet';
import { ScanHistoryCard } from '@/components/history/scan-history-card';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { HeaderTextButton } from '@/components/ui/header-text-button';
import { IconContainer } from '@/components/ui/icon-container';
import { InfoIcon, RotateCcwClockIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StateCard } from '@/components/ui/state-card';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import { MAX_SELECTION } from '@/services/history-controller';
import type { Severity } from '@/types/scan';
import { dataErrorMessage } from '@/utils/data-errors';

type Filter = 'all' | Extract<Severity, 'mild' | 'moderate' | 'severe'>;

/** Figma 10 — Scan History, with a "Manage" mode for deleting one, several or all scans. */
export default function ScanHistoryScreen() {
  const { t } = useI18n();
  const { history } = useUserData();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteTarget, setDeleteTarget] = useState<DeleteScansTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const scans = history.scans;
  const managing = history.selecting;
  // Nothing to show yet: the first page is still coming, or it failed. Neither is "no scans".
  const isLoadingFirst = history.status === 'loading' && scans.length === 0;
  const isFailed = history.status === 'failed';
  // Truly empty only when there is nothing older to load either.
  const isEmpty = history.status === 'ready' && scans.length === 0 && !history.hasMore;
  // Everything loaded was deleted but older scans exist: they are being fetched.
  const isCatchingUp = history.status === 'ready' && scans.length === 0 && history.hasMore;
  const canManage = history.status === 'ready' && scans.length > 0;

  // "Manage" mode never outlives this screen: leaving it, by any gesture, clears the selection.
  const { endSelection } = history;
  useEffect(() => {
    endSelection();
    return () => endSelection();
  }, [endSelection]);

  // Android back button: leave Manage mode first instead of leaving the screen.
  const isDeleting = history.deleting;
  useEffect(() => {
    if (!managing) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDeleting) endSelection();
      return true;
    });
    return () => subscription.remove();
  }, [managing, isDeleting, endSelection]);

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t.history.filterAll },
    { value: 'mild', label: t.result.severityValue.mild },
    { value: 'moderate', label: t.result.severityValue.moderate },
    { value: 'severe', label: t.result.severityValue.severe },
  ];

  // Filters work on the scans loaded so far; "Load more" brings in older ones. In Manage mode the
  // filter is fixed to "All", so "select all" can only ever mean the whole history.
  const visibleScans = filter === 'all' || managing ? scans : scans.filter((scan) => scan.severity === filter);

  const pickedCount = history.allSelected ? (history.hasMore ? null : scans.length) : history.selectedIds.length;
  const title = !managing
    ? t.history.title
    : pickedCount === null
      ? t.history.selectedAllTitle
      : t.history.selectedTitle(pickedCount);

  const enterManage = () => {
    setFilter('all');
    history.beginSelection();
  };

  const deleteLabel = history.deleting
    ? t.history.deleting
    : history.allSelected
      ? t.history.deleteEverything
      : history.selectedIds.length === 0
        ? t.history.deleteSelected
        : t.history.deleteCount(history.selectedIds.length);
  const nothingPicked = !history.allSelected && history.selectedIds.length === 0;

  const openConfirm = () => {
    if (history.deleting || nothingPicked) return;
    setDeleteError(null);
    // Fixed now, so the dialog cannot change if the selection does.
    setDeleteTarget(history.allSelected ? { kind: 'all' } : { kind: 'some', ids: history.selectedIds });
  };

  const closeConfirm = () => {
    if (history.deleting) return;
    setDeleteError(null);
    setDeleteTarget(null);
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      // Nothing changes on this device until the backend confirmed the deletion.
      const done =
        deleteTarget.kind === 'all' ? await history.deleteAll() : await history.deleteSelected(deleteTarget.ids);
      if (done) {
        setDeleteTarget(null);
        AccessibilityInfo.announceForAccessibility(t.history.deletedAnnouncement);
      } else {
        setDeleteError(t.dataErrors.historyNotReady);
      }
    } catch (error) {
      // The scans and the selection are still there; the dialog stays open to try again.
      setDeleteError(dataErrorMessage(error, t));
    }
  };

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={title}
          backLabel={managing ? t.common.cancel : undefined}
          onBack={managing ? () => history.endSelection() : undefined}
          accessory={
            managing ? (
              <HeaderTextButton
                label={history.allSelected ? t.history.deselectAll : t.history.selectAll}
                disabled={history.deleting}
                onPress={history.allSelected ? history.clearSelection : history.selectAll}
              />
            ) : canManage ? (
              <HeaderTextButton label={t.history.manage} onPress={enterManage} />
            ) : undefined
          }
        />
      }
      onRefresh={managing ? undefined : () => void history.refresh()}
      refreshing={history.refreshing}
      footer={
        managing ? (
          <ActionBar>
            <AppButton
              variant="destructive"
              label={deleteLabel}
              disabled={nothingPicked || history.deleting}
              onPress={openConfirm}
              style={styles.deleteButton}
            />
          </ActionBar>
        ) : undefined
      }>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20}>
          <AppIcon icon={RotateCcwClockIcon} size={20} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="cardTitle">{t.history.introTitle}</AppText>
          <AppText variant="bodySmall" color={Colors.text.secondary}>
            {t.history.introBody}
          </AppText>
        </View>
        {scans.length > 0 || isEmpty ? (
          <View style={styles.countBadge}>
            <AppText variant="captionSemibold" color={Colors.brand.primary}>
              {history.hasMore ? `${scans.length}+` : scans.length}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.filters}>
        {filters.map((option) => {
          const selected = option.value === filter;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected, disabled: managing }}
              accessibilityLabel={option.label}
              disabled={managing}
              hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => setFilter(option.value)}
              style={({ pressed }) => [
                styles.filter,
                selected ? styles.filterSelected : styles.filterIdle,
                (pressed || managing) && styles.pressed,
              ]}>
              <AppText
                variant="label"
                color={selected ? Colors.text.onBrand : Colors.text.secondary}
                numberOfLines={1}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {managing && history.allSelected ? (
        <AppText variant="caption" color={Colors.text.muted} accessibilityLiveRegion="polite">
          {t.history.allSelectedHint}
        </AppText>
      ) : null}
      {managing && !history.allSelected && history.selectedIds.length >= MAX_SELECTION ? (
        <AppText variant="caption" color={Colors.text.muted} accessibilityLiveRegion="polite">
          {t.history.selectLimit}
        </AppText>
      ) : null}

      <AppText variant="sectionTitle" accessibilityRole="header" style={styles.sectionTitle}>
        {t.history.recentScans}
      </AppText>

      {isLoadingFirst ? <StateCard loading title={t.history.loading} /> : null}

      {isFailed ? (
        <StateCard
          icon={<AppIcon icon={InfoIcon} size={22} />}
          title={t.history.loadFailedTitle}
          body={t.history.loadFailedBody}
          actionLabel={t.common.retry}
          onAction={() => void history.refresh()}
        />
      ) : null}

      {visibleScans.map((scan) => (
        <ScanHistoryCard
          key={scan.id}
          result={scan}
          selectable={managing}
          selected={history.allSelected || history.selectedIds.includes(scan.id)}
          locked={history.allSelected || history.deleting}
          onPress={() =>
            managing ? history.toggleSelected(scan.id) : router.push({ pathname: '/scan-result', params: { id: scan.id } })
          }
        />
      ))}

      {isCatchingUp && history.loadingMore ? <StateCard loading title={t.history.loading} /> : null}

      {isEmpty ? (
        <View style={styles.empty}>
          <AppText variant="cardTitle" color={Colors.text.secondary} align="center">
            {t.history.emptyTitle}
          </AppText>
          <AppText variant="bodySmall" color={Colors.text.muted} align="center">
            {t.history.emptyBody}
          </AppText>
        </View>
      ) : null}

      {scans.length > 0 && visibleScans.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="cardTitle" color={Colors.text.secondary} align="center">
            {t.history.noMatches}
          </AppText>
        </View>
      ) : null}

      {filter !== 'all' && !managing && history.hasMore ? (
        <AppText variant="footnote" color={Colors.text.muted} align="center">
          {t.history.filterNote}
        </AppText>
      ) : null}

      {history.loadError && !isFailed ? (
        <AppText variant="bodySmall" color={Colors.brand.primary} align="center" accessibilityLiveRegion="polite">
          {t.history.updateFailed}
        </AppText>
      ) : null}

      {history.status === 'ready' && history.hasMore ? (
        <AppButton
          variant="secondary"
          label={history.loadingMore ? t.history.loadingMore : t.history.loadMore}
          // Locked while a page is loading, so a second tap cannot ask for the same page twice.
          disabled={history.loadingMore || history.refreshing || history.deleting}
          onPress={() => void history.loadMore()}
        />
      ) : null}

      <Notice
        icon={<AppIcon icon={InfoIcon} size={16} />}
        tone="blush"
        message={t.history.disclaimer}
        style={styles.notice}
      />

      <DeleteScansSheet
        target={deleteTarget}
        busy={history.deleting}
        error={deleteError}
        onConfirm={() => void submitDelete()}
        onClose={closeConfirm}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.blush(0.78),
  },
  introCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  countBadge: {
    minWidth: 44,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Alpha.white(0.78),
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  filter: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
    borderRadius: Radius.pill,
  },
  filterSelected: {
    backgroundColor: Colors.brand.vivid,
  },
  filterIdle: {
    backgroundColor: Alpha.white(0.64),
    borderWidth: 1,
    borderColor: Alpha.taupe(0.26),
  },
  sectionTitle: {
    marginTop: Spacing.xs,
  },
  empty: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xxl,
  },
  notice: {
    marginTop: Spacing.xs,
    gap: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
  },
  deleteButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
