import { View } from 'react-native';

import { LegendDot } from '@/components/result/legend-dot';
import { AppText } from '@/components/ui/app-text';
import { useI18n } from '@/i18n/i18n-provider';
import type { AcneCategory } from '@/types/scan';

/** Figma "Section / Acne Types Detected" and its empty counterpart in 08A. */
export function AcneTypesSection({ categories }: { categories: AcneCategory[] }) {
  const { t } = useI18n();
  const hasTypes = categories.length > 0;

  return (
    <View className="gap-3 rounded-lg bg-surface-card p-4">
      <AppText variant="cardTitle" accessibilityRole="header">
        {hasTypes ? t.result.acneTypesDetected : t.result.acneTypeAssessment}
      </AppText>

      {hasTypes ? (
        <View className="flex-row flex-wrap gap-2">
          {categories.map((category) => (
            <View
              key={category}
              className={`min-h-9 grow basis-[46%] flex-row items-center gap-2 rounded-md px-3 py-1 ${
                category === 'comedonal' ? 'bg-peach/[0.22]' : 'bg-rose/[0.12]'
              }`}>
              <LegendDot category={category} />
              {/* Wraps under Dynamic Type instead of running out of the chip. */}
              <AppText variant="caption" className="shrink text-fg-secondary">
                {t.result.category[category]}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <View className="min-h-9 justify-center rounded-md border border-success-border bg-success-surface-alt px-2 py-1">
          <AppText variant="caption" className="text-center text-fg-secondary">
            {t.result.noVisibleTypes}
          </AppText>
        </View>
      )}
    </View>
  );
}
