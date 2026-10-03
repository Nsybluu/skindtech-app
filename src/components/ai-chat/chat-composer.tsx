import { Pressable, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { SendHorizontalIcon } from '@/components/ui/icons';
import { Colors } from '@/constants/colors';
import { Effects } from '@/constants/effects';
import { MAX_FONT_SIZE_MULTIPLIER } from '@/constants/typography';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

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
    // The bottom padding depends on the tab bar and keyboard (runtime value).
    <View className="gap-3 bg-white/[0.88] px-5 pt-4" style={{ paddingBottom: bottomPadding }}>
      <View className="w-full max-w-content flex-row items-end gap-2 self-center">
        <View className="min-h-[52px] flex-1 justify-center rounded-lg border border-line-brand bg-white/[0.82] px-4 py-2">
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
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            className="max-h-24 font-noto-regular text-field-multiline text-fg-primary"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.aiChat.send}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={onSend}
          className={cn(
            'size-[52px] items-center justify-center rounded-lg bg-brand-gradient-start active:opacity-[0.55]',
            !canSend && 'opacity-[0.55]',
          )}
          style={Effects.gradientPrimary}>
          <AppIcon icon={SendHorizontalIcon} size={20} color={Colors.text.onBrand} />
        </Pressable>
      </View>

      <AppText variant="footnote" className="text-center text-fg-muted">
        {t.aiChat.disclaimer}
      </AppText>
    </View>
  );
}
