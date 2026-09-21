import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ScanFaceIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { ScanResult } from '@/types/scan';
import { formatScanDate } from '@/utils/format';

type LatestResultCardProps = {
  result: ScanResult;
  onPress: () => void;
};

/** Figma "Latest Result / Populated State". */
export function LatestResultCard({ result, onPress }: LatestResultCardProps) {
  const { t, language } = useI18n();
  const summary = t.result.summary(result.amount, result.severity);

  return (
    <View style={styles.section}>
      <AppText variant="titleLarge" accessibilityRole="header">
        {t.home.latestResult}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <IconContainer size={44} radius={Radius.l}>
          <AppIcon icon={ScanFaceIcon} size={22} />
        </IconContainer>
        <View style={styles.copy}>
          <AppText variant="title" numberOfLines={1}>
            {summary}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {formatScanDate(result.scannedAt, { language, todayLabel: t.result.today, relative: true })}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.m,
  },
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.card,
    backgroundColor: Colors.surface.card,
  },
  copy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  pressed: {
    opacity: 0.85,
  },
});
