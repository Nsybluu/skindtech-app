import type { FC } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import MildPreviewIcon from '@/assets/illustrations/scan-preview-mild.svg';
import ModeratePreviewIcon from '@/assets/illustrations/scan-preview-moderate.svg';
import SeverePreviewIcon from '@/assets/illustrations/scan-preview-severe.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { CheckIcon } from '@/components/ui/icons';
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
  /** "Manage" mode: the card is a checkbox instead of a button, with a selection circle at its end. */
  selectable?: boolean;
  selected?: boolean;
  /** The selection cannot change right now (everything is selected, or a deletion is running). */
  locked?: boolean;
};

/** Figma "Scan History Card". */
export function ScanHistoryCard({
  result,
  onPress,
  selectable = false,
  selected = false,
  locked = false,
}: ScanHistoryCardProps) {
  const { t, language } = useI18n();
  const { Icon, background, border } = PREVIEW[result.severity];
  const summary = t.result.summary(result.amount, result.severity);
  const date = formatScanDate(result.scannedAt, { language, todayLabel: t.result.today });

  return (
    <Pressable
      accessibilityRole={selectable ? 'checkbox' : 'button'}
      accessibilityLabel={selectable ? `${summary}, ${date}` : summary}
      accessibilityState={selectable ? { checked: selected, disabled: locked } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: border },
        selectable && selected && styles.cardSelected,
        pressed && !locked && styles.pressed,
      ]}>
      <View style={[styles.preview, { backgroundColor: background }]}>
        <Icon />
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" color={Colors.text.muted}>
          {date}
        </AppText>
        {/* Long Thai summaries wrap to a second line instead of being cut off. */}
        <AppText variant="cardTitle" color={Colors.brand.primary} numberOfLines={2}>
          {summary}
        </AppText>
        <AppText variant="caption" color={Colors.text.secondary} numberOfLines={2}>
          {t.result.categoryList(getDetectedCategories(result))}
        </AppText>
        {selectable ? null : (
          <AppText variant="captionSemibold" color={Colors.brand.primary}>
            {t.history.viewResult}
          </AppText>
        )}
      </View>
      {selectable ? (
        <View style={[styles.circle, selected && styles.circleSelected]}>
          {selected ? <AppIcon icon={CheckIcon} size={14} color={Colors.text.onBrand} strokeWidth={3} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    // 12pt between thumbnail, text and the selection circle keeps a two-word summary on one line.
    gap: Spacing.m,
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
  // Clear but not loud: a rose border and a faint blush fill.
  cardSelected: {
    borderColor: Alpha.rose(0.6),
    backgroundColor: Alpha.blush(0.9),
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Alpha.taupe(0.6),
    backgroundColor: Alpha.white(0.9),
  },
  circleSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
