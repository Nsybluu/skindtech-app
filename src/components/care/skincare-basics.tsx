import type { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import CleanserIcon from '@/assets/icons/cleanser.svg';
import MoisturizerIcon from '@/assets/icons/moisturizer.svg';
import SunscreenIcon from '@/assets/icons/sunscreen.svg';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import type { TextVariant } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';

/** Figma "Card / Skincare Basics" — three product tiles. */
export function SkincareBasics() {
  const { t } = useI18n();

  const tiles: { key: string; label: string; Icon: FC<SvgProps>; variant: TextVariant }[] = [
    { key: 'cleanser', label: t.care.basicCleanser, Icon: CleanserIcon, variant: 'footnote' },
    { key: 'moisturizer', label: t.care.basicMoisturizer, Icon: MoisturizerIcon, variant: 'footnote' },
    { key: 'sunscreen', label: t.care.basicSunscreen, Icon: SunscreenIcon, variant: 'micro' },
  ];

  return (
    <View style={styles.card}>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t.care.basicsTitle}
      </AppText>
      <View style={styles.row}>
        {tiles.map(({ key, label, Icon, variant }) => (
          <View key={key} style={styles.tile}>
            <Icon />
            <AppText variant={variant} color={Colors.text.secondary} align="center">
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
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.m,
    borderRadius: Radius.m,
    backgroundColor: Alpha.white(0.68),
  },
});
