import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { DropletIcon, SoapDispenserDropletIcon, SunMediumIcon, type LucideIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { CareBasic } from '@/types/recommendation';

const ICONS: Record<CareBasic, LucideIcon> = {
  gentle_cleanser: SoapDispenserDropletIcon,
  lightweight_moisturizer: DropletIcon,
  non_comedogenic_spf: SunMediumIcon,
};

/** Figma "Card / Skincare Basics" — one tile per basic the recommendation names. */
export function SkincareBasics({ basics }: { basics: CareBasic[] }) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <AppText variant="cardTitle" accessibilityRole="header">
        {t.care.basicsTitle}
      </AppText>
      <View style={styles.row}>
        {basics.map((basic) => (
          <View key={basic} style={styles.tile}>
            <AppIcon icon={ICONS[basic]} size={20} />
            {/* All tiles share one size; a long label wraps instead of shrinking. */}
            <AppText variant="footnote" color={Colors.text.secondary} align="center">
              {t.care.basic[basic]}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.rose(0.07),
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  tile: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    // Just enough side padding for "Non-comedogenic" to stay on one line at the caption size.
    paddingHorizontal: Spacing.xxs,
    paddingVertical: Spacing.m,
    borderRadius: Radius.m,
    backgroundColor: Alpha.white(0.68),
  },
});
