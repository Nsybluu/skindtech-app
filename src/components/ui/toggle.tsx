import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/utils/cn';

/** Track `w-12` (48) minus the `size-6` knob (24) minus the `px-0.5` padding on both sides (4). */
const KNOB_TRAVEL = 20;

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  /** Ignores taps and dims the switch, e.g. while the new value is being saved. */
  disabled?: boolean;
};

/** Switch drawn to match Figma "Toggle / AI Improvement / On" (48 × 28, rose track). */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled = false }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [progress, value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      className={cn(
        'h-7 w-12 justify-center rounded-full px-0.5',
        value ? 'bg-brand-primary' : 'bg-taupe/[0.45]',
        disabled && 'opacity-[0.55]',
      )}>
      <Animated.View className="size-6 rounded-full bg-white" style={knobStyle} />
    </Pressable>
  );
}
