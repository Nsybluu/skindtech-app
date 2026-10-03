import { Pressable } from 'react-native';

import { AppText } from './app-text';

type HeaderTextButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

/** Short text action in a screen header ("Manage", "Select all", "Cancel"). */
export function HeaderTextButton({ label, onPress, disabled = false, accessibilityHint }: HeaderTextButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      className={`min-h-10 justify-center px-1 active:opacity-50 ${disabled ? 'opacity-50' : ''}`}>
      <AppText variant="label" className="text-brand-primary" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
