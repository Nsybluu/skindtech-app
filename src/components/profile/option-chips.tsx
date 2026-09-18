import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

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
  height?: number;
  multiple?: boolean;
};

/** Selectable pills used by the Skin Profile form. */
export function OptionChips<T extends string>({
  rows,
  isSelected,
  onPress,
  height = 40,
  multiple = false,
}: OptionChipsProps<T>) {
  return (
    <View style={styles.rows}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((option) => {
            const selected = isSelected(option.value);
            return (
              <Pressable
                key={option.value}
                accessibilityRole={multiple ? 'checkbox' : 'radio'}
                accessibilityState={multiple ? { checked: selected } : { selected }}
                accessibilityLabel={option.label}
                onPress={() => onPress(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  { flexGrow: option.flex, height },
                  selected ? styles.selected : styles.idle,
                  pressed && styles.pressed,
                ]}>
                <AppText
                  variant="label"
                  color={selected ? Colors.text.onBrand : Colors.text.secondary}
                  align="center"
                  numberOfLines={1}>
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

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.s,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.s,
  },
  chip: {
    flexBasis: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s,
    borderRadius: Radius.m,
  },
  selected: {
    backgroundColor: Colors.brand.primary,
  },
  idle: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Alpha.taupe(0.28),
  },
  pressed: {
    opacity: 0.8,
  },
});
