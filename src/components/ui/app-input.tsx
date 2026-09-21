import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
import { FontFamily } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';

import { AppText } from './app-text';

type AppInputProps = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  /** Adds the eye toggle from the Figma password fields. */
  secure?: boolean;
};

export function AppInput({ label, secure = false, onFocus, onBlur, ...inputProps }: AppInputProps) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(secure);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText variant="body" color={Colors.text.label}>
        {label}
      </AppText>
      <View style={[styles.box, focused && styles.boxFocused]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
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
            style={({ pressed }) => pressed && styles.pressed}>
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

const styles = StyleSheet.create({
  field: {
    gap: Spacing.s,
  },
  box: {
    height: Layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingHorizontal: Spacing.l,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.input,
    backgroundColor: Colors.surface.input,
  },
  boxFocused: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.surface.cardStrong,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: Colors.text.primary,
  },
  pressed: {
    opacity: 0.6,
  },
});
