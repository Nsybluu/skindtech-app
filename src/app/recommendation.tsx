import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import EveningIcon from '@/assets/icons/evening.svg';
import GuidanceIcon from '@/assets/icons/guidance.svg';
import HabitsIcon from '@/assets/icons/habits.svg';
import InfoIcon from '@/assets/icons/info.svg';
import MorningIcon from '@/assets/icons/morning.svg';
import { RoutineCard } from '@/components/care/routine-card';
import { SkincareBasics } from '@/components/care/skincare-basics';
import { ActionBar } from '@/components/ui/action-bar';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import { Notice } from '@/components/ui/notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { useUserData } from '@/providers/app-provider';

/** Figma 09 — Care Recommendations (static, non-medical guidance). */
export default function RecommendationScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getScanResult, scanHistory } = useUserData();

  const result = (id ? getScanResult(id) : undefined) ?? scanHistory[0];
  const isClear = result ? result.amount === 'none' : false;

  return (
    <AppScreen
      header={<ScreenHeader title={t.care.title} titleVariant="screenTitle" />}
      gap={Spacing.m}
      footer={
        <ActionBar>
          <AppButton
            variant="secondary"
            label={t.common.scanAgain}
            onPress={() => router.dismissTo('/scan')}
            style={styles.secondary}
          />
          <AppButton
            variant="solid"
            label={t.care.backToHome}
            onPress={() => router.dismissTo('/')}
            style={styles.primary}
          />
        </ActionBar>
      }>
      <View style={styles.intro}>
        <IconContainer size={40} radius={Radius.l}>
          <GuidanceIcon />
        </IconContainer>
        <View style={styles.introCopy}>
          <AppText variant="label">{t.care.basedOnResult}</AppText>
          {result ? (
            <AppText variant="caption" weight="semibold" color={Colors.brand.primary}>
              {t.care.summary(result.amount, result.severity)}
            </AppText>
          ) : null}
          <AppText variant="footnote" color={Colors.text.secondary}>
            {isClear ? t.care.introBodyClear : t.care.introBody}
          </AppText>
        </View>
      </View>

      <RoutineCard
        title={t.care.morningRoutine}
        icon={<MorningIcon />}
        iconBackground={Alpha.peach(0.22)}
        steps={t.care.morningSteps}
      />
      <RoutineCard
        title={t.care.eveningRoutine}
        icon={<EveningIcon />}
        iconBackground={Alpha.rose(0.1)}
        steps={t.care.eveningSteps}
      />

      <SkincareBasics />

      <View style={styles.habits}>
        <IconContainer size={36} radius={Radius.m} backgroundColor={Alpha.rose(0.1)}>
          <HabitsIcon />
        </IconContainer>
        <View style={styles.habitsCopy}>
          <AppText variant="label">{t.care.habitsTitle}</AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {t.care.habitsBody}
          </AppText>
        </View>
      </View>

      <Notice
        icon={<InfoIcon />}
        title={t.care.professionalTitle}
        titleVariant="captionSemibold"
        message={t.care.professionalBody}
        messageVariant="footnote"
        style={styles.professional}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
  secondary: {
    width: 104,
  },
  primary: {
    flex: 1,
  },
});
