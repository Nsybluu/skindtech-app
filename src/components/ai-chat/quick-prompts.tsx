import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
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
    <View className="gap-2">
      <AppText variant="titleSmall" accessibilityRole="header">
        {t.aiChat.suggestedQuestions}
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {QUICK_PROMPTS.map((promptId) => (
          <Pressable
            key={promptId}
            accessibilityRole="button"
            accessibilityLabel={t.aiChat.prompts[promptId]}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onSelect(promptId)}
            hitSlop={{ top: 4, bottom: 4 }}
            className={`min-h-9 justify-center rounded-md bg-peach/[0.22] px-3 py-2 active:opacity-70 ${disabled ? 'opacity-70' : ''}`}>
            <AppText variant="label" className="text-fg-secondary">
              {t.aiChat.prompts[promptId]}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
