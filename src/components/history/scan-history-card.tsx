import type { FC } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import MildPreviewIcon from '@/assets/illustrations/scan-preview-mild.svg';
import ModeratePreviewIcon from '@/assets/illustrations/scan-preview-moderate.svg';
import SeverePreviewIcon from '@/assets/illustrations/scan-preview-severe.svg';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult, Severity } from '@/types/scan';
import { formatScanDate, getDetectedCategories } from '@/utils/format';

const PREVIEW: Record<Severity, { Icon: FC<SvgProps>; background: string; border: string }> = {
  none: { Icon: MildPreviewIcon, background: Colors.history.mild, border: Alpha.taupe(0.24) },
  mild: { Icon: MildPreviewIcon, background: Colors.history.mild, border: Alpha.taupe(0.24) },
  moderate: { Icon: ModeratePreviewIcon, background: Colors.history.moderate, border: Alpha.rose(0.2) },
  severe: { Icon: SeverePreviewIcon, background: Colors.history.severe, border: Alpha.rose(0.24) },
};

type ScanHistoryCardProps = {
  result: ScanResult;
  onPress: () => void;
};

/** Figma "Scan History Card". */
export function ScanHistoryCard({ result, onPress }: ScanHistoryCardProps) {
  const { t, language } = useI18n();
  const { Icon, background, border } = PREVIEW[result.severity];
  const summary = t.result.summary(result.amount, result.severity);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={summary}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: border }, pressed && styles.pressed]}>
      <View style={[styles.preview, { backgroundColor: background }]}>
        <Icon />
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" color={Colors.text.muted}>
          {formatScanDate(result.scannedAt, { language, todayLabel: t.result.today })}
        </AppText>
        <AppText variant="titleSmall" color={Colors.brand.primary} numberOfLines={1}>
          {summary}
        </AppText>
        <AppText variant="caption" color={Colors.text.secondary} numberOfLines={1}>
          {t.result.categoryList(getDetectedCategories(result))}
        </AppText>
        <AppText variant="caption" weight="semibold" color={Colors.brand.primary}>
          {t.history.viewResult}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.l,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    backgroundColor: Alpha.white(0.82),
  },
  preview: {
    width: 64,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.l,
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
});
