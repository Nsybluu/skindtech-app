import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import type { TextVariant } from '@/constants/typography';

import { AppText } from './app-text';

export type NoticeTone = 'rose' | 'blush';

type NoticeProps = {
  icon: ReactNode;
  message: string;
  title?: string;
  tone?: NoticeTone;
  messageVariant?: TextVariant;
  titleVariant?: TextVariant;
  /** Title color; Figma uses ink for informational and rose for warnings. */
  titleColor?: string;
  style?: StyleProp<ViewStyle>;
};

const TONE_BACKGROUND: Record<NoticeTone, string> = {
  rose: Colors.surface.notice,
  blush: Alpha.blush(0.78),
};

/**
 * Tinted info row (icon + text) used for disclaimers and hints.
 * Padding / radius / min height are passed via `style` to match each Figma instance.
 */
export function Notice({
  icon,
  message,
  title,
  tone = 'rose',
  messageVariant = 'caption',
  titleVariant = 'caption',
  titleColor = Colors.brand.primary,
  style,
}: NoticeProps) {
  return (
    <View style={[styles.container, { backgroundColor: TONE_BACKGROUND[tone] }, style]}>
      {icon}
      <View style={styles.copy}>
        {title ? (
          <AppText variant={titleVariant} weight="semibold" color={titleColor}>
            {title}
          </AppText>
        ) : null}
        <AppText variant={messageVariant} color={Colors.text.secondary}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    padding: Spacing.m,
    borderRadius: Radius.l,
  },
  copy: {
    flex: 1,
    gap: Spacing.xxs,
  },
});
