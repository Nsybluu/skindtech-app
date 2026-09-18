import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult } from '@/types/scan';

/** Figma "Card / Overall Analysis" — acne amount and severity. */
export function OverallAnalysisCard({ result }: { result: ScanResult }) {
  const { t } = useI18n();
  const isClear = result.amount === 'none';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t.result.overallAnalysis}
        </AppText>
        {result.isDemoData ? (
          <Badge
            label={t.result.demoBadge}
            minWidth={92}
            backgroundColor={Alpha.taupe(0.22)}
            color={Colors.text.secondary}
          />
        ) : (
          <Badge label={t.common.preliminary} minWidth={92} />
        )}
      </View>
      <View style={styles.stats}>
        <Stat
          label={t.result.acneAmount}
          value={t.result.amountValue[result.amount]}
          backgroundColor={isClear ? Colors.success.surface : Alpha.rose(0.08)}
          valueColor={isClear ? Colors.success.text : Colors.brand.primary}
        />
        <Stat
          label={t.result.severity}
          value={t.result.severityValue[result.severity]}
          backgroundColor={isClear ? Colors.success.surface : Alpha.rose(0.12)}
          valueColor={isClear ? Colors.success.text : Colors.brand.primary}
        />
      </View>
    </View>
  );
}

type StatProps = {
  label: string;
  value: string;
  backgroundColor: string;
  valueColor: string;
};

function Stat({ label, value, backgroundColor, valueColor }: StatProps) {
  return (
    <View style={[styles.stat, { backgroundColor }]}>
      <AppText variant="footnote" color={Colors.text.muted} numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="title" color={valueColor} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Colors.surface.cardStrong,
  },
  header: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  stat: {
    flex: 1,
    minHeight: 60,
    justifyContent: 'center',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
  },
});
