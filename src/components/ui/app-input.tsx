import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import EyeIcon from '@/assets/icons/eye.svg';
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

export function AppInput({ label, secure = false, ...inputProps }: AppInputProps) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.field}>
      <AppText variant="body" color={Colors.text.label}>
        {label}
      </AppText>
      <View style={styles.box}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={Colors.text.muted}
          selectionColor={Colors.brand.primary}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          {...inputProps}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t.signIn.showPassword : t.signIn.hidePassword}
            hitSlop={10}
            onPress={() => setHidden((value) => !value)}
            style={({ pressed }) => pressed && styles.pressed}>
            <EyeIcon />
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
