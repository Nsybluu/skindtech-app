import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Image } from '@/components/ui/styled';
import { Effects } from '@/constants/effects';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/utils/cn';

type CameraFrameProps = {
  guidanceTitle: string;
  guidanceBody: string;
  /** `warning` is the rose pill from 07B — Image Quality Issue. */
  tone?: 'default' | 'warning';
  topRightAccessory?: ReactNode;
  /** Live camera preview supplied by the scan screen. */
  cameraContent?: ReactNode;
  /** Captured local image shown during review and analysis. */
  photoUri?: string | null;
  /** Dims the captured image (used behind a warning). */
  dimmed?: boolean;
  /** Shown instead of a preview when there is no camera or photo (e.g. camera access is off). */
  emptyContent?: ReactNode;
};

/**
 * Dark preview frame: a live camera (with corner brackets), the captured photo
 * or an empty-state message, and the guidance pill underneath.
 */
export function CameraFrame({
  guidanceTitle,
  guidanceBody,
  tone = 'default',
  topRightAccessory,
  cameraContent,
  photoUri,
  dimmed = false,
  emptyContent,
}: CameraFrameProps) {
  const { t } = useI18n();

  return (
    <View
      className="min-h-[280px] flex-1 overflow-hidden rounded-2xl bg-canvas-camera"
      style={Effects.shadowCamera}>
      <View className="flex-1 overflow-hidden">
        {cameraContent ? (
          <>
            <View className="absolute inset-0">{cameraContent}</View>
            <FramingGuide />
          </>
        ) : photoUri ? (
          <Image
            source={{ uri: photoUri }}
            contentFit="cover"
            className={cn('absolute inset-0', dimmed && 'opacity-[0.55]')}
            accessibilityLabel={t.scan.photoLabel}
          />
        ) : emptyContent ? (
          <View className="flex-1 items-center justify-center px-6">{emptyContent}</View>
        ) : null}
      </View>

      <View
        accessibilityRole={tone === 'warning' ? 'alert' : 'summary'}
        className={cn(
          'mx-4 mb-4 mt-3 min-h-16 justify-center gap-0.5 rounded-lg px-4 py-3',
          tone === 'warning' ? 'min-h-[76px] bg-brand-primary' : 'bg-surface-overlay-chip',
        )}>
        <AppText variant="label" className="text-center text-fg-on-brand">
          {guidanceTitle}
        </AppText>
        <AppText variant="caption" className="px-1 text-center text-fg-on-dark-muted">
          {guidanceBody}
        </AppText>
      </View>

      {topRightAccessory ? <View className="absolute right-3 top-3">{topRightAccessory}</View> : null}
    </View>
  );
}

/** Four corner brackets that frame where the face should sit; no artwork over the camera. */
function FramingGuide() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 items-center justify-center">
      <View className="aspect-[0.8] h-[78%]">
        <View className="absolute left-0 top-0 size-7 rounded-tl-md border-l-[3px] border-t-[3px] border-white/[0.85]" />
        <View className="absolute right-0 top-0 size-7 rounded-tr-md border-r-[3px] border-t-[3px] border-white/[0.85]" />
        <View className="absolute bottom-0 left-0 size-7 rounded-bl-md border-b-[3px] border-l-[3px] border-white/[0.85]" />
        <View className="absolute bottom-0 right-0 size-7 rounded-br-md border-b-[3px] border-r-[3px] border-white/[0.85]" />
      </View>
    </View>
  );
}

/** Round 34pt button on the preview (the flip-camera button). */
export const CAMERA_ROUND_BUTTON_CLASS = 'size-[34px] items-center justify-center rounded-full bg-white/[0.12]';
