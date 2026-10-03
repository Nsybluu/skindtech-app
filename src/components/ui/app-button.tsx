import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Effects } from '@/constants/effects';
import type { TextVariant } from '@/constants/typography';
import { cn } from '@/utils/cn';

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
  /** Layout classes of the caller (width, margin, a different `h-*`); they replace the variant's own. */
  className?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

const VARIANTS: Record<ButtonVariant, { containerClass: string; textVariant: TextVariant; textClass: string }> = {
  gradient: {
    // The gradient itself is `Effects.primaryButton`; the flat colour is what shows if it cannot draw.
    containerClass: 'h-14 gap-2 bg-brand-gradient-start',
    textVariant: 'buttonLarge',
    textClass: 'text-fg-on-brand',
  },
  solid: { containerClass: 'h-14 gap-2 bg-brand-primary', textVariant: 'button', textClass: 'text-fg-on-brand' },
  secondary: {
    containerClass: 'h-14 gap-2 border border-line-brand-strong bg-surface-secondary-button',
    textVariant: 'button',
    textClass: 'text-brand-primary',
  },
  outline: {
    containerClass: 'h-12 gap-2 border border-rose/[0.28] bg-white/[0.62]',
    textVariant: 'button',
    textClass: 'text-brand-primary',
  },
  google: {
    containerClass: 'h-14 gap-4 border border-line-button bg-white',
    textVariant: 'buttonLarge',
    textClass: 'text-fg-google',
  },
  destructive: { containerClass: 'h-14 gap-2 bg-danger-fill', textVariant: 'button', textClass: 'text-fg-on-brand' },
};

const EFFECTS = {
  gradient: Effects.primaryButton,
  google: Effects.shadowGoogle,
} as const;

export function AppButton({
  label,
  onPress,
  variant = 'gradient',
  icon,
  className,
  accessibilityLabel,
  disabled = false,
}: AppButtonProps) {
  const spec = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'flex-row items-center justify-center rounded-lg px-1 active:opacity-[0.85]',
        spec.containerClass,
        // A delete button that cannot be used yet must look unavailable, not merely pressed.
        disabled && (variant === 'destructive' ? 'opacity-40' : 'opacity-[0.85]'),
        className,
      )}
      style={variant === 'gradient' || variant === 'google' ? EFFECTS[variant] : undefined}>
      {icon ? <View>{icon}</View> : null}
      <AppText
        variant={spec.textVariant}
        // Google's own button guidelines ask for a medium weight; every other button is semibold.
        weight={variant === 'google' ? 'medium' : undefined}
        className={cn('shrink text-center', spec.textClass)}
        numberOfLines={2}>
        {label}
      </AppText>
    </Pressable>
  );
}
