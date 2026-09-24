import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Alpha, Colors, Gradients } from '@/constants/colors';
import { Layout, Radius, Shadows, Spacing } from '@/constants/spacing';
import type { TextVariant } from '@/constants/typography';

import { AppText } from './app-text';

export type ButtonVariant =
  /** Rose gradient with soft shadow (auth, Home, Save Skin Profile). */
  | 'gradient'
  /** Flat rose fill (action bars, sheets). */
  | 'solid'
  /** Translucent white with rose border (Retake, Scan again, Cancel). */
  | 'secondary'
  /** Sign out. */
  | 'outline'
  /** White button with Google mark. */
  | 'google'
  /** Irreversible actions: deleting scans. */
  | 'destructive';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
};

const VARIANT_DEFAULTS: Record<
  ButtonVariant,
  { height: number; radius: number; textVariant: TextVariant; textColor: string; iconGap: number }
> = {
  gradient: {
    height: Layout.primaryButtonHeight,
    radius: Radius.l,
    textVariant: 'buttonLarge',
    textColor: Colors.text.onBrand,
    iconGap: Spacing.s,
  },
  solid: {
    height: Layout.buttonHeight,
    radius: Radius.l,
    textVariant: 'button',
    textColor: Colors.text.onBrand,
    iconGap: Spacing.s,
  },
  secondary: {
    height: Layout.buttonHeight,
    radius: Radius.l,
    textVariant: 'button',
    textColor: Colors.brand.primary,
    iconGap: Spacing.s,
  },
  outline: {
    height: 48,
    radius: Radius.l,
    textVariant: 'button',
    textColor: Colors.brand.primary,
    iconGap: Spacing.s,
  },
  google: {
    height: Layout.buttonHeight,
    radius: Radius.l,
    textVariant: 'buttonLarge',
    textColor: Colors.text.google,
    iconGap: Spacing.l,
  },
  destructive: {
    height: Layout.buttonHeight,
    radius: Radius.l,
    textVariant: 'button',
    textColor: Colors.text.onBrand,
    iconGap: Spacing.s,
  },
};

export function AppButton({
  label,
  onPress,
  variant = 'gradient',
  icon,
  height,
  radius,
  style,
  accessibilityLabel,
  disabled = false,
}: AppButtonProps) {
  const defaults = VARIANT_DEFAULTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        {
          height: height ?? defaults.height,
          borderRadius: radius ?? defaults.radius,
          gap: defaults.iconGap,
        },
        (pressed || disabled) && styles.pressed,
        // A delete button that cannot be used yet must look unavailable, not merely pressed.
        disabled && variant === 'destructive' && styles.disabledDestructive,
        style,
      ]}>
      {icon ? <View>{icon}</View> : null}
      <AppText
        variant={defaults.textVariant}
        // Google's own button guidelines ask for a medium weight; every other button is semibold.
        weight={variant === 'google' ? 'medium' : undefined}
        color={defaults.textColor}
        align="center"
        numberOfLines={2}
        style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  disabledDestructive: {
    opacity: 0.4,
  },
});

const variantStyles = StyleSheet.create({
  gradient: {
    backgroundColor: Colors.brand.gradientStart,
    experimental_backgroundImage: Gradients.primary,
    boxShadow: Shadows.primary,
  },
  solid: {
    backgroundColor: Colors.brand.primary,
  },
  secondary: {
    backgroundColor: Colors.surface.secondaryButton,
    borderWidth: 1,
    borderColor: Colors.border.brandStrong,
  },
  outline: {
    backgroundColor: Alpha.white(0.62),
    borderWidth: 1,
    borderColor: Alpha.rose(0.28),
  },
  google: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border.button,
    boxShadow: Shadows.google,
  },
  destructive: {
    backgroundColor: Colors.danger.fill,
  },
});
