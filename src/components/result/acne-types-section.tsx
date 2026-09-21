import { StyleSheet, View } from 'react-native';

import { LegendDot } from '@/components/result/legend-dot';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { AcneCategory } from '@/types/scan';

/** Figma "Section / Acne Types Detected" and its empty counterpart in 08A. */
export function AcneTypesSection({ categories }: { categories: AcneCategory[] }) {
  const { t } = useI18n();
  const hasTypes = categories.length > 0;

  return (
    <View style={styles.section}>
      <AppText variant="titleSmall" accessibilityRole="header">
        {hasTypes ? t.result.acneTypesDetected : t.result.acneTypeAssessment}
      </AppText>

      {hasTypes ? (
        <View style={styles.chips}>
          {categories.map((category) => (
            <View
              key={category}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    category === 'comedonal' ? Alpha.peach(0.22) : Alpha.rose(0.12),
                },
              ]}>
              <LegendDot category={category} />
              <AppText variant="caption" color={Colors.text.secondary} numberOfLines={1}>
                {t.result.category[category]}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyMessage}>
          <AppText variant="caption" color={Colors.text.secondary} align="center">
            {t.result.noVisibleTypes}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
    backgroundColor: Colors.surface.card,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  chip: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: Radius.m,
  },
  emptyMessage: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.m,
    borderWidth: 1,
    borderColor: Colors.success.border,
    backgroundColor: Colors.success.surfaceAlt,
  },
});
