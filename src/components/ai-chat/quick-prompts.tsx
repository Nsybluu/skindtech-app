import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import { QUICK_PROMPTS } from '@/mocks/chat';
import type { ChatPromptId } from '@/types/chat';

type QuickPromptsProps = {
  onSelect: (promptId: ChatPromptId) => void;
  disabled?: boolean;
};

/** Figma "Suggested questions" + "Quick Prompt" chips. */
export function QuickPrompts({ onSelect, disabled = false }: QuickPromptsProps) {
  const { t } = useI18n();

  return (
    <View style={styles.section}>
      <AppText variant="captionSemibold" accessibilityRole="header">
        {t.aiChat.suggestedQuestions}
      </AppText>
      <View style={styles.chips}>
        {QUICK_PROMPTS.map((promptId) => (
          <Pressable
            key={promptId}
            accessibilityRole="button"
            accessibilityLabel={t.aiChat.prompts[promptId]}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onSelect(promptId)}
            style={({ pressed }) => [styles.chip, (pressed || disabled) && styles.pressed]}>
            <AppText variant="footnoteSemibold" color={Colors.text.secondary} align="center">
              {t.aiChat.prompts[promptId]}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.s,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: Radius.m,
    backgroundColor: Alpha.peach(0.22),
  },
  pressed: {
    opacity: 0.7,
  },
});
