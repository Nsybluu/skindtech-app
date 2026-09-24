import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScanHistoryCard } from '@/components/history/scan-history-card';
import { AppButton } from '@/components/ui/app-button';
import { AppIcon } from '@/components/ui/app-icon';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { InfoIcon, RotateCcwClockIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StateCard } from '@/components/ui/state-card';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import type { Severity } from '@/types/scan';

type Filter = 'all' | Extract<Severity, 'mild' | 'moderate' | 'severe'>;

/** Figma 10 — Scan History. */
export default function ScanHistoryScreen() {
  const { t } = useI18n();
  const { history } = useUserData();
  const [filter, setFilter] = useState<Filter>('all');
  const scans = history.scans;
  // Nothing to show yet: the first page is still coming, or it failed. Neither is "no scans".
  const isLoadingFirst = history.status === 'loading' && scans.length === 0;
  const isFailed = history.status === 'failed';
  const isEmpty = history.status === 'ready' && scans.length === 0;

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t.history.filterAll },
    { value: 'mild', label: t.result.severityValue.mild },
    { value: 'moderate', label: t.result.severityValue.moderate },
    { value: 'severe', label: t.result.severityValue.severe },
  ];

  // Filters work on the scans loaded so far; "Load more" brings in older ones.
  const visibleScans = filter === 'all' ? scans : scans.filter((scan) => scan.severity === filter);

  return (
    <AppScreen
      header={<ScreenHeader title={t.history.title} titleVariant="screenTitle" />}
      onRefresh={() => void history.refresh()}
      refreshing={history.refreshing}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20}>
          <AppIcon icon={RotateCcwClockIcon} size={20} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="titleSmall">{t.history.introTitle}</AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {t.history.introBody}
          </AppText>
        </View>
        {scans.length > 0 || isEmpty ? (
          <View style={styles.countBadge}>
            <AppText variant="caption" weight="semibold" color={Colors.brand.primary}>
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
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setFilter(option.value)}
              style={({ pressed }) => [
                styles.filter,
                selected ? styles.filterSelected : styles.filterIdle,
                pressed && styles.pressed,
              ]}>
              <AppText
                variant="caption"
                weight={selected ? 'semibold' : 'regular'}
                color={selected ? Colors.text.onBrand : Colors.text.secondary}
                numberOfLines={1}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="titleSmall" accessibilityRole="header" style={styles.sectionTitle}>
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
          onPress={() => router.push({ pathname: '/scan-result', params: { id: scan.id } })}
        />
      ))}

      {isEmpty ? (
        <View style={styles.empty}>
          <AppText variant="titleSmall" color={Colors.text.secondary} align="center">
            {t.history.emptyTitle}
          </AppText>
          <AppText variant="caption" color={Colors.text.muted} align="center">
            {t.history.emptyBody}
          </AppText>
        </View>
      ) : null}

      {scans.length > 0 && visibleScans.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="titleSmall" color={Colors.text.secondary} align="center">
            {t.history.noMatches}
          </AppText>
        </View>
      ) : null}

      {filter !== 'all' && history.hasMore ? (
        <AppText variant="footnote" color={Colors.text.muted} align="center">
          {t.history.filterNote}
        </AppText>
      ) : null}

      {history.loadError && !isFailed ? (
        <AppText variant="caption" color={Colors.brand.primary} align="center" accessibilityLiveRegion="polite">
          {t.history.updateFailed}
        </AppText>
      ) : null}

      {history.status === 'ready' && history.hasMore ? (
        <AppButton
          variant="secondary"
          label={history.loadingMore ? t.history.loadingMore : t.history.loadMore}
          // Locked while a page is loading, so a second tap cannot ask for the same page twice.
          disabled={history.loadingMore || history.refreshing}
          onPress={() => void history.loadMore()}
        />
      ) : null}

      <Notice
        icon={<AppIcon icon={InfoIcon} size={16} />}
        tone="blush"
        message={t.history.disclaimer}
        messageVariant="footnote"
        style={styles.notice}
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
  pressed: {
    opacity: 0.8,
  },
});
