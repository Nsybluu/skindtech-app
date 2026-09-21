import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';

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
  photoOpacity?: number;
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
  photoOpacity = 1,
  emptyContent,
}: CameraFrameProps) {
  const { t } = useI18n();

  return (
    <View style={styles.frame}>
      <View style={styles.viewport}>
        {cameraContent ? (
          <>
            <View style={styles.media}>{cameraContent}</View>
            <FramingGuide />
          </>
        ) : photoUri ? (
          <Image
            source={{ uri: photoUri }}
            contentFit="cover"
            style={[styles.media, { opacity: photoOpacity }]}
            accessibilityLabel={t.scan.photoLabel}
          />
        ) : emptyContent ? (
          <View style={styles.empty}>{emptyContent}</View>
        ) : null}
      </View>

      <View
        accessibilityRole={tone === 'warning' ? 'alert' : 'summary'}
        style={[styles.guidance, tone === 'warning' && styles.guidanceWarning]}>
        <AppText variant="bodySmall" weight="semibold" color={Colors.text.onBrand} align="center">
          {guidanceTitle}
        </AppText>
        <AppText variant="caption" color={Colors.text.onDarkMuted} align="center" style={styles.guidanceBody}>
          {guidanceBody}
        </AppText>
      </View>

      {topRightAccessory ? <View style={styles.topRight}>{topRightAccessory}</View> : null}
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
      style={styles.guideLayer}>
      <View style={styles.guide}>
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;
const CORNER_RADIUS = 12;
const GUIDE_COLOR = Alpha.white(0.85);

const corner = (edges: ViewStyle): ViewStyle => ({
  ...edges,
  width: CORNER_SIZE,
  height: CORNER_SIZE,
  borderColor: GUIDE_COLOR,
});

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 280,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.background.camera,
    boxShadow: Shadows.camera,
    overflow: 'hidden',
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  media: {
    ...StyleSheet.absoluteFill,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  guideLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    height: '78%',
    aspectRatio: 0.8,
  },
  corner: {
    position: 'absolute',
  },
  cornerTopLeft: corner({
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: CORNER_RADIUS,
  }),
  cornerTopRight: corner({
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: CORNER_RADIUS,
  }),
  cornerBottomLeft: corner({
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: CORNER_RADIUS,
  }),
  cornerBottomRight: corner({
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: CORNER_RADIUS,
  }),
  guidance: {
    minHeight: 64,
    marginTop: Spacing.m,
    marginHorizontal: Spacing.l,
    marginBottom: Spacing.l,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    gap: Spacing.xxs,
    justifyContent: 'center',
    borderRadius: Radius.l,
    backgroundColor: Colors.surface.overlayChip,
  },
  guidanceWarning: {
    minHeight: 76,
    backgroundColor: Colors.brand.primary,
  },
  guidanceBody: {
    paddingHorizontal: Spacing.xs,
  },
  topRight: {
    position: 'absolute',
    top: Spacing.m,
    right: Spacing.m,
  },
});

export const cameraAccessoryStyles = StyleSheet.create({
  roundButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Alpha.white(0.12),
  },
});
