import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
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
    <View style={styles.card} accessibilityLiveRegion="polite">
      <AppText variant="titleLarge" color={Colors.progress.title}>
        {t.analyzing.cardTitle}
      </AppText>
      <AppText variant="bodySmall" color={Colors.brand.primary}>
        {t.analyzing.stepProgress(step, total, steps[step - 1].label)}
      </AppText>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <View>
        {steps.map((item, index) => {
          const done = index < step - 1;
          return (
            <AppText key={item.label} variant="bodySmall" color={Colors.progress.text}>
              {done ? `✓  ${item.done}` : `•  ${item.label}`}
            </AppText>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 190,
    gap: Spacing.s,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.progress.border,
    backgroundColor: Colors.progress.surface,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.progress.track,
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
  },
});
