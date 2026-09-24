import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
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
            // The pill is only 28pt tall; extend the touch area to the 44pt minimum.
            hitSlop={{ top: 8, bottom: 8 }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.pressed,
            ]}>
            <AppText
              variant={selected ? 'footnoteSemibold' : 'footnote'}
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
    borderRadius: 16,
    backgroundColor: Alpha.rose(0.08),
  },
  segment: {
    height: 28,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
    borderRadius: 14,
  },
  segmentSelected: {
    backgroundColor: Colors.brand.primary,
  },
  pressed: {
    opacity: 0.6,
  },
});
