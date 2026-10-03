import { View } from 'react-native';

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
    <View className="gap-3">
      <View className="flex-row items-center gap-3 rounded-lg bg-rose/[0.09] p-4">
        <IconContainer className="size-10 rounded-lg">
          <AppIcon icon={FaceSlightlySmilingIcon} size={18} />
        </IconContainer>
        <View className="flex-1 gap-0.5">
          <AppText variant="sectionTitle" accessibilityRole="header">
            {t.care.sectionTitle}
          </AppText>
          <AppText variant="caption" className="text-fg-secondary">
            {isClear ? t.care.introBodyClear : t.care.introBody}
          </AppText>
        </View>
      </View>

      {demo ? (
        <Notice icon={<AppIcon icon={InfoIcon} size={18} />} tone="blush" message={t.care.demoNotice} className="py-3" />
      ) : null}

      <RoutineCard
        title={t.care.morningRoutine}
        icon={<AppIcon icon={SunIcon} size={15} />}
        iconClassName="bg-peach/[0.22]"
        steps={content.morningSteps.map((step) => t.care.step[step])}
      />
      <RoutineCard
        title={t.care.eveningRoutine}
        icon={<AppIcon icon={MoonStarIcon} size={15} />}
        iconClassName="bg-rose/[0.1]"
        steps={content.eveningSteps.map((step) => t.care.step[step])}
      />

      <SkincareBasics basics={content.basics} />

      <View className="flex-row items-start gap-3 rounded-lg bg-white/[0.7] p-4">
        <IconContainer className="size-9 rounded-md bg-rose/[0.1]">
          <AppIcon icon={ClipboardCheckIcon} size={18} />
        </IconContainer>
        <View className="flex-1 gap-1">
          <AppText variant="cardTitle">{t.care.habitsTitle}</AppText>
          <View className="gap-1">
            {content.habits.map((habit) => (
              <AppText key={habit} variant="bodySmall" className="text-fg-secondary">
                {`•  ${t.care.habit[habit]}`}
              </AppText>
            ))}
          </View>
        </View>
      </View>

      {personalization ? (
        <View className="gap-3 rounded-lg border border-line-brand bg-surface-card-strong p-4">
          <View className="flex-row items-center gap-3">
            <IconContainer className="size-9 rounded-md bg-peach/[0.24]">
              <AppIcon icon={SparklesIcon} size={18} />
            </IconContainer>
            <AppText variant="cardTitle" accessibilityRole="header" className="flex-1">
              {t.care.personalizedTitle}
            </AppText>
          </View>
          {/* Plain text in the app's own language: never markup, never the other language. */}
          <AppText variant="body" className="text-fg-secondary">
            {personalization.summary[language]}
          </AppText>
          <View className="gap-1">
            {personalization.tips.map((tip, index) => (
              <AppText key={index} variant="bodySmall" className="text-fg-secondary">
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
          className="p-4">
          <View className="gap-1">
            {professionalHelp.reasons.map((reason) => (
              <AppText key={reason} variant="caption" className="text-fg-secondary">
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
          titleClassName="text-fg-primary"
          message={t.care.professionalBody}
          className="p-4"
        />
      )}

      <AppText variant="footnote" className="text-center text-fg-muted">
        {t.care.disclaimer[content.disclaimer]}
      </AppText>
    </View>
  );
}
