import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import type { FontWeightName } from '@/constants/typography';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Figma keeps "Original" regular and "Detected" semibold in both states. */
  weight: FontWeightName;
  width: number;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Figma "Segmented Control / Result Image" (Original · Detected). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            // The pill is only 22pt tall; extend the touch area to the 44pt minimum.
            hitSlop={{ top: 11, bottom: 11 }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              { width: option.width },
              selected && styles.segmentSelected,
              pressed && !selected && styles.pressed,
            ]}>
            <AppText
              variant="micro"
              weight={option.weight}
              color={selected ? Colors.text.onBrand : Colors.text.muted}
              numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: 13,
    backgroundColor: Alpha.rose(0.08),
  },
  segment: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentSelected: {
    backgroundColor: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.6,
  },
});
