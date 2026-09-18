import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import HistoryIcon from '@/assets/icons/history-large.svg';
import InfoSmallIcon from '@/assets/icons/info-small.svg';
import { ScanHistoryCard } from '@/components/history/scan-history-card';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';
import type { Severity } from '@/types/scan';

type Filter = 'all' | Extract<Severity, 'mild' | 'moderate' | 'severe'>;

/** Figma 10 — Scan History. */
export default function ScanHistoryScreen() {
  const { t } = useI18n();
  const { scanHistory } = useUserData();
  const [filter, setFilter] = useState<Filter>('all');

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t.history.filterAll },
    { value: 'mild', label: t.result.severityValue.mild },
    { value: 'moderate', label: t.result.severityValue.moderate },
    { value: 'severe', label: t.result.severityValue.severe },
  ];

  const visibleScans =
    filter === 'all' ? scanHistory : scanHistory.filter((scan) => scan.severity === filter);

  return (
    <AppScreen header={<ScreenHeader title={t.history.title} titleVariant="screenTitle" />}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={20}>
          <HistoryIcon />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="titleSmall">{t.history.introTitle}</AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {t.history.introBody}
          </AppText>
        </View>
        <View style={styles.countBadge}>
          <AppText variant="caption" weight="semibold" color={Colors.brand.primary}>
            {scanHistory.length}
          </AppText>
        </View>
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

      {visibleScans.length > 0 ? (
        visibleScans.map((scan) => (
          <ScanHistoryCard
            key={scan.id}
            result={scan}
            onPress={() => router.push({ pathname: '/scan-result', params: { id: scan.id } })}
          />
        ))
      ) : (
        <View style={styles.empty}>
          <AppText variant="titleSmall" color={Colors.text.secondary} align="center">
            {scanHistory.length === 0 ? t.history.emptyTitle : t.history.noMatches}
          </AppText>
          {scanHistory.length === 0 ? (
            <AppText variant="caption" color={Colors.text.muted} align="center">
              {t.history.emptyBody}
            </AppText>
          ) : null}
        </View>
      )}

      <Notice
        icon={<InfoSmallIcon />}
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
