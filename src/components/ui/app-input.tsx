import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

import { AppText } from './app-text';

type AppInputProps = Omit<TextInputProps, 'style' | 'className' | 'secureTextEntry'> & {
  label: string;
  /** Adds the eye toggle from the Figma password fields. */
  secure?: boolean;
};

export function AppInput({ label, secure = false, onFocus, onBlur, ...inputProps }: AppInputProps) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <AppText variant="body" className="text-fg-label">
        {label}
      </AppText>
      <View
        className={cn(
          'h-14 flex-row items-center gap-3 rounded-lg border px-4',
          focused ? 'border-brand-primary bg-surface-card-strong' : 'border-line-input bg-surface-input',
        )}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          secureTextEntry={hidden}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          autoCapitalize="none"
          autoCorrect={false}
          className="h-full flex-1 font-noto-regular text-field text-fg-primary"
          {...inputProps}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.signIn.showPassword : t.signIn.hidePassword}
            hitSlop={10}
            onPress={() => setHidden((value) => !value)}
            className="active:opacity-60">
            {/* The icon shows the current state: open eye = password visible, closed eye = hidden. */}
            {hidden ? (
              <AppIcon icon={EyeOffIcon} size={26} color={Colors.icon.strong} />
            ) : (
              <AppIcon icon={EyeIcon} size={26} color={Colors.icon.strong} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
