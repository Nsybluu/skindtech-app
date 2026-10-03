import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { IconContainer } from '@/components/ui/icon-container';
import { useI18n } from '@/i18n/i18n-provider';

type RoutineCardProps = {
  title: string;
  icon: ReactNode;
  /** Background class of the icon tile: morning uses the peach tint, evening the rose tint. */
  iconClassName: string;
  steps: string[];
};

/** Figma "Card / Morning Routine" and "Card / Evening Routine". */
export function RoutineCard({ title, icon, iconClassName, steps }: RoutineCardProps) {
  const { t } = useI18n();

  return (
    <View className="gap-2 rounded-lg border border-taupe/[0.22] bg-surface-card-strong p-4">
      <View className="min-h-6 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-2">
          <IconContainer className={`size-6 rounded-sm ${iconClassName}`}>{icon}</IconContainer>
          <AppText variant="cardTitle" numberOfLines={2} className="shrink">
            {title}
          </AppText>
        </View>
        <Badge label={t.care.stepCount(steps.length)} className="min-w-[65px] bg-rose/[0.08]" />
      </View>

      <View className="gap-1">
        {steps.map((step, index) => (
          <AppText key={`${index}-${step}`} variant="bodySmall" className="text-fg-secondary">
            {`${index + 1}   ${step}`}
          </AppText>
        ))}
      </View>
    </View>
  );
}
