import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { useI18n } from '@/i18n/i18n-provider';

type AnalysisProgressCardProps = {
  /** 1-based step currently in progress. */
  currentStep: number;
};

/** Figma "Card / Processing Status" (07C — Analyzing). */
export function AnalysisProgressCard({ currentStep }: AnalysisProgressCardProps) {
  const { t } = useI18n();
  const steps = t.analyzing.steps;
  const total = steps.length;
  const step = Math.min(Math.max(currentStep, 1), total);

  const progress = useSharedValue(step / total);
  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 400 });
  }, [progress, step, total]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      className="min-h-[190px] gap-2 rounded-lg border border-progress-border bg-progress-surface p-4"
      accessibilityLiveRegion="polite">
      <AppText variant="cardTitle" className="text-progress-title">
        {t.analyzing.cardTitle}
      </AppText>
      <AppText variant="label" className="text-brand-primary">
        {t.analyzing.stepProgress(step, total, steps[step - 1].label)}
      </AppText>
      <View
        className="h-2 overflow-hidden rounded-full bg-progress-track"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}>
        {/* The fill's width is animated, so it is a Reanimated style. */}
        <Animated.View className="h-2 rounded-full bg-brand-primary" style={fillStyle} />
      </View>
      <View>
        {steps.map((item, index) => {
          const done = index < step - 1;
          return (
            <AppText key={item.label} variant="bodySmall" className="text-progress-text">
              {done ? `✓  ${item.done}` : `•  ${item.label}`}
            </AppText>
          );
        })}
      </View>
    </View>
  );
}
