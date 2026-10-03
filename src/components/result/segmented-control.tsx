import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/utils/cn';

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
    <View className="flex-row gap-0.5 rounded-lg bg-rose/[0.08] p-0.5">
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
            className={cn(
              'h-7 min-w-16 items-center justify-center rounded-[14px] px-3',
              selected ? 'bg-brand-primary' : 'active:opacity-60',
            )}>
            <AppText
              variant={selected ? 'footnoteSemibold' : 'footnote'}
              numberOfLines={1}
              className={selected ? 'text-fg-on-brand' : 'text-fg-muted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
