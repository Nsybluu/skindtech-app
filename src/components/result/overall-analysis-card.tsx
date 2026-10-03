import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult } from '@/types/scan';
import { cn } from '@/utils/cn';

/** Figma "Card / Overall Analysis" — acne amount and severity. */
export function OverallAnalysisCard({ result }: { result: ScanResult }) {
  const { t } = useI18n();
  const isClear = result.amount === 'none';

  return (
    <View className="gap-3 rounded-lg border border-line-brand bg-surface-card-strong p-4">
      <View className="min-h-[22px] flex-row items-center justify-between gap-2">
        <AppText variant="cardTitle" accessibilityRole="header">
          {t.result.overallAnalysis}
        </AppText>
        {result.isDemoData ? (
          <Badge
            label={t.result.demoBadge}
            className="min-w-[92px] bg-taupe/[0.22]"
            textClassName="text-fg-secondary"
          />
        ) : (
          <Badge label={t.common.preliminary} className="min-w-[92px]" />
        )}
      </View>
      <View className="flex-row gap-3">
        <Stat
          label={t.result.acneAmount}
          value={t.result.amountValue[result.amount]}
          className={isClear ? 'bg-success-surface' : 'bg-rose/[0.08]'}
          valueClassName={isClear ? 'text-success-text' : 'text-brand-primary'}
        />
        <Stat
          label={t.result.severity}
          value={t.result.severityValue[result.severity]}
          className={isClear ? 'bg-success-surface' : 'bg-rose/[0.12]'}
          valueClassName={isClear ? 'text-success-text' : 'text-brand-primary'}
        />
      </View>
    </View>
  );
}

type StatProps = {
  label: string;
  value: string;
  /** Background class of the tile. */
  className: string;
  /** Colour class of the value. */
  valueClassName: string;
};

function Stat({ label, value, className, valueClassName }: StatProps) {
  return (
    <View className={cn('min-h-[72px] flex-1 justify-center gap-0.5 rounded-md px-3 py-2', className)}>
      <AppText variant="caption" numberOfLines={1} className="text-fg-muted">
        {label}
      </AppText>
      {/* The headline figure of the analysis, so one step above a card title. */}
      <AppText variant="sectionTitle" className={valueClassName} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}
