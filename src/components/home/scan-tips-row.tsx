import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { ImageOffIcon, ScanFaceIcon, SunIcon, type LucideIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma "Tips / Before You Scan" — three quick-check tiles. */
export function ScanTipsRow() {
  const { t } = useI18n();

  const tips: { key: string; label: string; icon: LucideIcon }[] = [
    { key: 'lighting', label: t.home.tipGoodLighting, icon: SunIcon },
    { key: 'face-forward', label: t.home.tipFaceForward, icon: ScanFaceIcon },
    { key: 'no-filters', label: t.home.tipNoFilters, icon: ImageOffIcon },
  ];

  return (
    <View style={styles.section}>
      <AppText variant="titleLarge" color={Colors.brand.primary} accessibilityRole="header">
        {t.home.beforeYouScan}
      </AppText>
      <View style={styles.row}>
        {tips.map(({ key, label, icon }) => (
          <View key={key} style={styles.tile}>
            <AppIcon icon={icon} size={24} />
            <AppText variant="bodySmall" color={Colors.text.secondary} align="center" numberOfLines={2}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.m,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  tile: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.card,
    backgroundColor: Colors.surface.card,
  },
});
