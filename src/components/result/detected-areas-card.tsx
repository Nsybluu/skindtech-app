import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import ClearFaceIcon from '@/assets/icons/clear-face.svg';
import ClearFaceFrameIcon from '@/assets/icons/clear-face-frame.svg';
import ComedonalMarkerIcon from '@/assets/icons/marker-comedonal-outline.svg';
import InflammatoryMarkerIcon from '@/assets/icons/marker-inflammatory.svg';
import { AppText } from '@/components/ui/app-text';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { AcneCategory, ScanResult } from '@/types/scan';

import { DetectionOverlay } from './detection-overlay';
import { SegmentedControl, type SegmentOption } from './segmented-control';

type ImageMode = 'original' | 'detected';

const PHOTO_WIDTH = 180;
const PHOTO_HEIGHT = 188;

/** Figma "Card / Detected Areas" (and "Card / Reviewed Image" when nothing was found). */
export function DetectedAreasCard({ result, categories }: { result: ScanResult; categories: AcneCategory[] }) {
  const { t } = useI18n();
  const hasDetections = result.detectionAreas.length > 0;
  const [mode, setMode] = useState<ImageMode>(hasDetections ? 'detected' : 'original');
  const [boxWidth, setBoxWidth] = useState(318);

  const options: SegmentOption<ImageMode>[] = [
    { value: 'original', label: t.result.original, weight: 'regular', width: 57 },
    { value: 'detected', label: t.result.detected, weight: 'semibold', width: 65 },
  ];

  const onLayout = (event: LayoutChangeEvent) => setBoxWidth(event.nativeEvent.layout.width);
  const sourceAspect = result.image ? result.image.width / result.image.height : PHOTO_WIDTH / PHOTO_HEIGHT;
  const boxAspect = boxWidth / PHOTO_HEIGHT;
  const renderedWidth = sourceAspect > boxAspect ? boxWidth : PHOTO_HEIGHT * sourceAspect;
  const renderedHeight = sourceAspect > boxAspect ? boxWidth / sourceAspect : PHOTO_HEIGHT;
  const photoX = Math.max((boxWidth - renderedWidth) / 2, 0);
  const photoY = Math.max((PHOTO_HEIGHT - renderedHeight) / 2, 0);
  const showAreas = mode === 'detected' && hasDetections;
  const photoSource = result.photoUri
    ? { uri: result.photoUri }
    : hasDetections
      ? require('@/assets/images/detected-face-dark.png')
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="titleSmall" accessibilityRole="header">
          {hasDetections ? t.result.detectedAreas : t.result.reviewedImage}
        </AppText>
        <SegmentedControl options={options} value={mode} onChange={setMode} />
      </View>

      <View style={styles.imageBox} onLayout={onLayout}>
        {photoSource ? (
          <Image
            source={photoSource}
            contentFit="cover"
            style={{ width: renderedWidth, height: renderedHeight }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.photo}>
            <ClearFaceFrameIcon style={styles.clearFrame} />
            <ClearFaceIcon style={styles.clearFace} />
          </View>
        )}

        {showAreas ? (
          <DetectionOverlay
            width={boxWidth}
            height={PHOTO_HEIGHT}
            photo={{ x: photoX, y: photoY, width: renderedWidth, height: renderedHeight }}
            areas={result.detectionAreas}
          />
        ) : null}

        {showAreas ? (
          <View style={styles.legend}>
            {categories.map((category) => (
              <View key={category} style={styles.legendItem}>
                {category === 'comedonal' ? <ComedonalMarkerIcon /> : <InflammatoryMarkerIcon />}
                <AppText variant="footnote" color={Colors.text.onBrand} numberOfLines={1}>
                  {t.result.legend[category]}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.s,
    padding: Spacing.m,
    borderRadius: Radius.l,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.surface.cardStrong,
  },
  header: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s,
  },
  imageBox: {
    height: PHOTO_HEIGHT,
    borderRadius: Radius.m,
    backgroundColor: Colors.background.camera,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  clearFrame: {
    position: 'absolute',
    left: 13.9,
    top: 16.9,
  },
  clearFace: {
    position: 'absolute',
    left: 35.9,
    top: 20.9,
  },
  legend: {
    position: 'absolute',
    left: Spacing.m,
    right: Spacing.m,
    bottom: Spacing.m,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.l,
    borderRadius: Radius.m,
    backgroundColor: Alpha.ink(0.78),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
});
