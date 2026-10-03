import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

import { AppText } from './app-text';

export type NoticeTone = 'rose' | 'blush';

type NoticeProps = {
  icon: ReactNode;
  message: string;
  title?: string;
  tone?: NoticeTone;
  /** Title colour class; Figma uses ink for informational and rose (the default) for warnings. */
  titleClassName?: string;
  /** Extra rows under the message (for example a short list of reasons). */
  children?: ReactNode;
  /** Padding / radius / min height classes, passed to match each Figma instance. */
  className?: string;
};

const TONE_CLASS: Record<NoticeTone, string> = {
  rose: 'bg-surface-notice',
  blush: 'bg-blush/[0.78]',
};

/**
 * Tinted info row (icon + text) used for disclaimers and hints: an optional `label` title over a
 * `caption` message. Every notice reads the same, so the sizes are not configurable.
 */
export function Notice({
  icon,
  message,
  title,
  tone = 'rose',
  titleClassName = 'text-brand-primary',
  children,
  className,
}: NoticeProps) {
  return (
    <View className={cn('flex-row items-center gap-3 rounded-lg p-3', TONE_CLASS[tone], className)}>
      {icon}
      <View className="flex-1 gap-0.5">
        {title ? (
          <AppText variant="label" className={titleClassName}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="caption" className="text-fg-secondary">
          {message}
        </AppText>
        {children}
      </View>
    </View>
  );
}
