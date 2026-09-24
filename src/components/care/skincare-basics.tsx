import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { DropletIcon, SoapDispenserDropletIcon, SunMediumIcon, type LucideIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma "Card / Skincare Basics" — three product tiles. */
export function SkincareBasics() {
  const { t } = useI18n();

  const tiles: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'cleanser', label: t.care.basicCleanser, icon: SoapDispenserDropletIcon },
    { key: 'moisturizer', label: t.care.basicMoisturizer, icon: DropletIcon },
    { key: 'sunscreen', label: t.care.basicSunscreen, icon: SunMediumIcon },
  ];

  return (
    <View style={styles.card}>
      <AppText variant="cardTitle" accessibilityRole="header">
        {t.care.basicsTitle}
      </AppText>
      <View style={styles.row}>
        {tiles.map(({ key, label, icon }) => (
          <View key={key} style={styles.tile}>
            <AppIcon icon={icon} size={20} />
            {/* All three tiles share one size; a long label wraps instead of shrinking. */}
            <AppText variant="footnote" color={Colors.text.secondary} align="center">
              {label}
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
