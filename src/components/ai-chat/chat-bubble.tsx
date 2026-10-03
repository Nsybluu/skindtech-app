import { View } from 'react-native';

import TypingBubble from '@/assets/illustrations/ai-typing.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { Effects } from '@/constants/effects';

/** Figma "Chat Bubble / Assistant" — avatar plus reply text. */
export function AssistantBubble({ text }: { text: string }) {
  return (
    <View className="max-w-[92%] flex-row gap-3 self-start rounded-lg border border-line-brand bg-white/[0.8] p-3">
      <View className="size-7 items-center justify-center">
        <View className="absolute inset-0 rounded-full bg-peach/[0.32]" />
        <View className="absolute">
          <AppIcon icon={FaceSlightlySmilingIcon} size={14} />
        </View>
      </View>
      <AppText variant="body" className="flex-1 pt-1 text-fg-secondary">
        {text}
      </AppText>
    </View>
  );
}

/** Figma "Chat Bubble / User" — rose gradient, right aligned. */
export function UserBubble({ text }: { text: string }) {
  return (
    <View
      className="max-w-[86%] self-end rounded-lg bg-brand-gradient-start px-4 py-3"
      style={Effects.gradientPrimary}>
      <AppText variant="body" className="text-fg-on-brand">
        {text}
      </AppText>
    </View>
  );
}

/** Figma "Chat Bubble / Assistant / Typing". */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <View className="self-start" accessibilityRole="progressbar" accessibilityLabel={label}>
      <TypingBubble />
    </View>
  );
}
