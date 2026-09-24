import { StyleSheet, View } from 'react-native';

import { RoutineCard } from '@/components/care/routine-card';
import { SkincareBasics } from '@/components/care/skincare-basics';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { ClipboardCheckIcon, FaceSlightlySmilingIcon, InfoIcon, MoonStarIcon, SunIcon } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

type CareGuidanceProps = {
  /** No visible acne: the intro wording changes. */
  isClear: boolean;
  /**
   * The routine steps. They default to the app's static, non-medical guidance; a later phase can
   * pass the steps of a backend recommendation here without touching the layout.
   */
  morningSteps?: string[];
  eveningSteps?: string[];
};

/** "Basic care" — static, non-medical guidance shown below a scan result (was the separate Care Recommendations screen). */
export function CareGuidance({ isClear, morningSteps, eveningSteps }: CareGuidanceProps) {
  const { t } = useI18n();

  return (
    <View style={styles.section}>
      <View style={styles.intro}>
        <IconContainer size={40} radius={Radius.l}>
          <AppIcon icon={FaceSlightlySmilingIcon} size={18} />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="sectionTitle" accessibilityRole="header">
            {t.care.sectionTitle}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {isClear ? t.care.introBodyClear : t.care.introBody}
          </AppText>
        </View>
      </View>

      <RoutineCard
        title={t.care.morningRoutine}
        icon={<AppIcon icon={SunIcon} size={15} />}
        iconBackground={Alpha.peach(0.22)}
        steps={morningSteps ?? t.care.morningSteps}
      />
      <RoutineCard
        title={t.care.eveningRoutine}
        icon={<AppIcon icon={MoonStarIcon} size={15} />}
        iconBackground={Alpha.rose(0.1)}
        steps={eveningSteps ?? t.care.eveningSteps}
      />

      <SkincareBasics />

      <View style={styles.habits}>
        <IconContainer size={36} radius={Radius.m} backgroundColor={Alpha.rose(0.1)}>
          <AppIcon icon={ClipboardCheckIcon} size={18} />
        </IconContainer>
        <View style={styles.habitsCopy}>
          <AppText variant="cardTitle">{t.care.habitsTitle}</AppText>
          <AppText variant="bodySmall" color={Colors.text.secondary}>
            {t.care.habitsBody}
          </AppText>
        </View>
      </View>

      <Notice
        icon={<AppIcon icon={InfoIcon} size={18} />}
        title={t.care.professionalTitle}
        message={t.care.professionalBody}
        style={styles.professional}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.m,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.rose(0.09),
  },
  introCopy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  habits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.white(0.7),
  },
  habitsCopy: {
    flex: 1,
    gap: Spacing.xxs,
  },
  professional: {
    padding: Spacing.l,
  },
});
