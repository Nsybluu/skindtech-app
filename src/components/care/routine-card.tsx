import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { IconContainer } from '@/components/ui/icon-container';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type RoutineCardProps = {
  title: string;
  icon: ReactNode;
  /** Morning uses the peach tint, evening the rose tint. */
  iconBackground: string;
  steps: string[];
};

/** Figma "Card / Morning Routine" and "Card / Evening Routine". */
export function RoutineCard({ title, icon, iconBackground, steps }: RoutineCardProps) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.title}>
          <IconContainer size={24} radius={Radius.s} backgroundColor={iconBackground}>
            {icon}
          </IconContainer>
          <AppText variant="titleSmall" numberOfLines={1} style={styles.titleText}>
            {title}
          </AppText>
        </View>
        <Badge label={t.care.stepCount(steps.length)} minWidth={65} backgroundColor={Alpha.rose(0.08)} />
      </View>

      <View>
        {steps.map((step, index) => (
          <AppText key={step} variant="listStep" color={Colors.text.secondary}>
            {`${index + 1}   ${step}`}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.s,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Alpha.taupe(0.22),
    backgroundColor: Colors.surface.cardStrong,
  },
  header: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s,
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  titleText: {
    flexShrink: 1,
  },
});
