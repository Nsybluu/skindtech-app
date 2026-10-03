import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { cn } from '@/utils/cn';

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  /** Relative width, taken from the Figma chip widths. */
  flex: number;
};

type OptionChipsProps<T extends string> = {
  /** Chips are laid out in the same rows as the design. */
  rows: ChipOption<T>[][];
  isSelected: (value: T) => boolean;
  onPress: (value: T) => void;
  multiple?: boolean;
};

/** Selectable pills used by the Skin Profile form. */
export function OptionChips<T extends string>({ rows, isSelected, onPress, multiple = false }: OptionChipsProps<T>) {
  return (
    <View className="gap-2">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-2">
          {row.map((option) => {
            const selected = isSelected(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={multiple ? { checked: selected } : { selected }}
                accessibilityLabel={option.label}
                onPress={() => onPress(option.value)}
                // The Figma chip widths are data (`option.flex`), so the grow factor is a runtime value.
                style={{ flexGrow: option.flex }}
                className={cn(
                  'h-10 basis-0 items-center justify-center rounded-md px-2 active:opacity-80',
                  selected ? 'bg-brand-primary' : 'border border-taupe/[0.28] bg-surface-card',
                )}>
                <AppText
                  variant="label"
                  numberOfLines={1}
                  className={selected ? 'text-center text-fg-on-brand' : 'text-center text-fg-secondary'}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
