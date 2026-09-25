import { StyleSheet, View } from 'react-native';

import { RoutineCard } from '@/components/care/routine-card';
import { SkincareBasics } from '@/components/care/skincare-basics';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { IconContainer } from '@/components/ui/icon-container';
import {
  ClipboardCheckIcon,
  FaceSlightlySmilingIcon,
  InfoIcon,
  MoonStarIcon,
  SparklesIcon,
  SunIcon,
} from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { CareRecommendationContent } from '@/types/recommendation';

type CareGuidanceProps = {
  /** What the backend recommended (or, for demo data only, the local sample). */
  content: CareRecommendationContent;
  /** Sample guidance for a demo scan: says so, so it cannot be mistaken for the user's own. */
  demo?: boolean;
};

/**
 * "Basic care" below a scan result. It only draws `content`: every step, basic, habit and reason
 * is a semantic key translated here, so no raw key and no hard-coded advice reaches the screen.
 * General, non-medical guidance — never a diagnosis or treatment.
 */
export function CareGuidance({ content, demo = false }: CareGuidanceProps) {
  const { t, language } = useI18n();
  const isClear = content.basedOn.amount === 'none';
  const { personalization, professionalHelp } = content;

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

      {demo ? (
        <Notice icon={<AppIcon icon={InfoIcon} size={18} />} tone="blush" message={t.care.demoNotice} style={styles.notice} />
      ) : null}

      <RoutineCard
        title={t.care.morningRoutine}
        icon={<AppIcon icon={SunIcon} size={15} />}
        iconBackground={Alpha.peach(0.22)}
        steps={content.morningSteps.map((step) => t.care.step[step])}
      />
      <RoutineCard
        title={t.care.eveningRoutine}
        icon={<AppIcon icon={MoonStarIcon} size={15} />}
        iconBackground={Alpha.rose(0.1)}
        steps={content.eveningSteps.map((step) => t.care.step[step])}
      />

      <SkincareBasics basics={content.basics} />

      <View style={styles.habits}>
        <IconContainer size={36} radius={Radius.m} backgroundColor={Alpha.rose(0.1)}>
          <AppIcon icon={ClipboardCheckIcon} size={18} />
        </IconContainer>
        <View style={styles.habitsCopy}>
          <AppText variant="cardTitle">{t.care.habitsTitle}</AppText>
          <View style={styles.list}>
            {content.habits.map((habit) => (
              <AppText key={habit} variant="bodySmall" color={Colors.text.secondary}>
                {`•  ${t.care.habit[habit]}`}
              </AppText>
            ))}
          </View>
        </View>
      </View>

      {personalization ? (
        <View style={styles.personalized}>
          <View style={styles.personalizedHeader}>
            <IconContainer size={36} radius={Radius.m} backgroundColor={Alpha.peach(0.24)}>
              <AppIcon icon={SparklesIcon} size={18} />
            </IconContainer>
            <AppText variant="cardTitle" accessibilityRole="header" style={styles.personalizedTitle}>
              {t.care.personalizedTitle}
            </AppText>
          </View>
          {/* Plain text in the app's own language: never markup, never the other language. */}
          <AppText variant="body" color={Colors.text.secondary}>
            {personalization.summary[language]}
          </AppText>
          <View style={styles.list}>
            {personalization.tips.map((tip, index) => (
              <AppText key={index} variant="bodySmall" color={Colors.text.secondary}>
                {`•  ${tip[language]}`}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      {professionalHelp.recommended ? (
        <Notice
          icon={<AppIcon icon={InfoIcon} size={18} />}
          title={t.care.professionalRecommendedTitle}
          message={t.care.professionalRecommendedBody}
          style={styles.professional}>
          <View style={styles.list}>
            {professionalHelp.reasons.map((reason) => (
              <AppText key={reason} variant="caption" color={Colors.text.secondary}>
                {`•  ${t.care.professionalReason[reason]}`}
              </AppText>
            ))}
          </View>
        </Notice>
      ) : (
        // Calm and general: nothing here suggests the result is serious.
        <Notice
          icon={<AppIcon icon={InfoIcon} size={18} />}
          title={t.care.professionalTitle}
          titleColor={Colors.text.primary}
          message={t.care.professionalBody}
          style={styles.professional}
        />
      )}

      <AppText variant="footnote" color={Colors.text.muted} align="center">
        {t.care.disclaimer[content.disclaimer]}
      </AppText>
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
  notice: {
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
  },
  habits: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    backgroundColor: Alpha.white(0.7),
  },
  habitsCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  list: {
    gap: Spacing.xs,
  },
  personalized: {
    gap: Spacing.m,
    padding: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Colors.surface.cardStrong,
  },
  personalizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
  },
  personalizedTitle: {
    flex: 1,
  },
  professional: {
    padding: Spacing.l,
  },
});
