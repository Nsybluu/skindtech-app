import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';

const GUIDE_WIDTH = 238;
const GUIDE_HEIGHT = 306;

type CameraFrameProps = {
  guidanceTitle: string;
  guidanceBody: string;
  /** `warning` is the rose pill from 07B — Image Quality Issue. */
  tone?: 'default' | 'warning';
  illustrationOpacity?: number;
  topRightAccessory?: ReactNode;
  /** Live camera preview supplied by the scan screen. */
  cameraContent?: ReactNode;
  /** Captured local image shown during review and analysis. */
  photoUri?: string | null;
};

/**
 * Dark camera / photo preview with the face guide illustration.
 * A real camera feed would replace the illustration later (expo-camera).
 */
export function CameraFrame({
  guidanceTitle,
  guidanceBody,
  tone = 'default',
  illustrationOpacity = 1,
  topRightAccessory,
  cameraContent,
  photoUri,
}: CameraFrameProps) {
  return (
    <View style={styles.frame}>
      <View style={styles.illustrationArea}>
        {cameraContent ? <View style={styles.media}>{cameraContent}</View> : null}
        {!cameraContent && photoUri ? (
          <Image
            source={{ uri: photoUri }}
            contentFit="cover"
            style={styles.media}
            accessibilityLabel="Selected face photo"
          />
        ) : null}
        {!cameraContent && !photoUri ? (
          <>
            <View style={styles.topSpace} />
            <Image
              source={require('@/assets/images/face-scan-guide-dark.png')}
              contentFit="contain"
              style={[styles.illustration, { opacity: illustrationOpacity }]}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.bottomSpace} />
          </>
        ) : null}
        {cameraContent ? (
          <Image
            source={require('@/assets/images/face-scan-guide-dark.png')}
            contentFit="contain"
            style={[styles.cameraGuide, { opacity: 0.58 }]}
            accessibilityIgnoresInvertColors
          />
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

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    minHeight: 280,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.background.camera,
    boxShadow: Shadows.camera,
    overflow: 'hidden',
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  media: {
    ...StyleSheet.absoluteFill,
  },
  cameraGuide: {
    height: '88%',
    aspectRatio: GUIDE_WIDTH / GUIDE_HEIGHT,
  },
  // Figma places the guide 54 pt from the top and 14 pt above the guidance pill.
  topSpace: {
    flexGrow: 54,
    minHeight: 12,
  },
  bottomSpace: {
    flexGrow: 14,
    minHeight: 8,
  },
  illustration: {
    height: GUIDE_HEIGHT,
    aspectRatio: GUIDE_WIDTH / GUIDE_HEIGHT,
    flexShrink: 1,
  },
  guidance: {
    minHeight: 64,
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
