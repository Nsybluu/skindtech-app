import { StyleSheet, View } from 'react-native';

import TypingBubble from '@/assets/illustrations/ai-typing.svg';
import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { FaceSlightlySmilingIcon } from '@/components/ui/icons';
import { Alpha, Colors, Gradients } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

/** Figma "Chat Bubble / Assistant" — avatar plus reply text. */
export function AssistantBubble({ text }: { text: string }) {
  return (
    <View style={styles.assistant}>
      <View style={styles.avatar}>
        <View style={styles.avatarBackground} />
        <View style={styles.avatarIcon}>
          <AppIcon icon={FaceSlightlySmilingIcon} size={14} />
        </View>
      </View>
      <AppText variant="caption" color={Colors.text.secondary} style={styles.assistantText}>
        {text}
      </AppText>
    </View>
  );
}

/** Figma "Chat Bubble / User" — rose gradient, right aligned. */
export function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.user}>
      <AppText variant="caption" weight="semibold" color={Colors.text.onBrand}>
        {text}
      </AppText>
    </View>
  );
}

/** Figma "Chat Bubble / Assistant / Typing". */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <View style={styles.typing} accessibilityRole="progressbar" accessibilityLabel={label}>
      <TypingBubble />
    </View>
  );
}

const styles = StyleSheet.create({
  assistant: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    flexDirection: 'row',
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.brand,
    backgroundColor: Alpha.white(0.8),
  },
  avatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBackground: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    backgroundColor: Alpha.peach(0.32),
  },
  avatarIcon: {
    position: 'absolute',
  },
  assistantText: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    borderRadius: Radius.l,
    backgroundColor: Colors.brand.gradientStart,
    experimental_backgroundImage: Gradients.primary,
  },
  typing: {
    alignSelf: 'flex-start',
  },
});
