import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import SendIcon from '@/assets/icons/send.svg';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors, Gradients } from '@/constants/colors';
import { Layout, Radius, Spacing } from '@/constants/spacing';
import { FontFamily } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';

type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  /** Extra space under the composer; clears the floating tab bar when the keyboard is closed. */
  bottomPadding: number;
};

/** Figma "Composer / AI Chat" — message field, send button and disclaimer. */
export function ChatComposer({
  value,
  onChangeText,
  onSend,
  disabled = false,
  bottomPadding,
}: ChatComposerProps) {
  const { t } = useI18n();
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={[styles.composer, { paddingBottom: bottomPadding }]}>
      <View style={styles.row}>
        <View style={styles.inputBox}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={t.aiChat.placeholder}
            placeholderTextColor={Colors.text.muted}
            selectionColor={Colors.brand.primary}
            accessibilityLabel={t.aiChat.placeholder}
            returnKeyType="send"
            onSubmitEditing={() => canSend && onSend()}
            multiline
            style={styles.input}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.aiChat.send}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [styles.send, (pressed || !canSend) && styles.sendIdle]}>
          <SendIcon color={Colors.text.onBrand} />
        </Pressable>
      </View>

      <AppText variant="footnote" color={Colors.text.muted} align="center">
        {t.aiChat.disclaimer}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    gap: Spacing.m,
    paddingTop: Spacing.l,
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Alpha.white(0.88),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.s,
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
  },
  inputBox: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.s,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Alpha.white(0.82),
  },
  input: {
    maxHeight: 96,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text.primary,
  },
  send: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.l,
    backgroundColor: Colors.brand.gradientStart,
    experimental_backgroundImage: Gradients.primary,
  },
  sendIdle: {
    opacity: 0.55,
  },
});
