import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { ImageOffIcon } from '@/components/ui/icons';
import { Alpha, Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { useI18n } from '@/i18n/i18n-provider';
import type { AcneCategory, ScanResult } from '@/types/scan';

import { DetectionOverlay } from './detection-overlay';
import { LegendDot } from './legend-dot';
import { SegmentedControl, type SegmentOption } from './segmented-control';

type ImageMode = 'original' | 'detected';

const PLACEHOLDER_HEIGHT = 188;
/** Portrait phone photos fill the card at their own shape; only extreme shapes are cropped. */
const DEFAULT_ASPECT = 180 / 188;
const MIN_PHOTO_ASPECT = 0.75;
const MAX_PHOTO_ASPECT = 1.5;

/**
 * Figma "Card / Detected Areas" (and "Card / Reviewed Image" when nothing was found).
 *
 * The photo exists only for a scan made in this session (`photoUri`). A scan loaded from the
 * backend has none, and no picture is made up for it: `NoPhotoCard` says so instead and keeps
 * the detection summary.
 */
export function DetectedAreasCard({ result, categories }: { result: ScanResult; categories: AcneCategory[] }) {
  if (!result.photoUri) return <NoPhotoCard result={result} />;
  return <PhotoCard result={result} photoUri={result.photoUri} categories={categories} />;
}

function NoPhotoCard({ result }: { result: ScanResult }) {
  const { t } = useI18n();
  const count = result.detectionAreas.length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="titleSmall" accessibilityRole="header">
          {count > 0 ? t.result.detectedAreas : t.result.reviewedImage}
        </AppText>
      </View>
      <View style={[styles.imageBox, styles.imageBoxPlaceholder, styles.noPhoto]}>
        <AppIcon icon={ImageOffIcon} size={26} color={Colors.text.onBrand} />
        <AppText variant="caption" weight="semibold" color={Colors.text.onBrand} align="center">
          {t.result.photoUnavailableTitle}
        </AppText>
        <AppText variant="footnote" color={Alpha.white(0.8)} align="center">
          {t.result.photoUnavailableBody}
        </AppText>
      </View>
      <AppText variant="caption" color={Colors.text.secondary}>
        {t.result.detectedAreaCount(count)}
      </AppText>
    </View>
  );
}

function PhotoCard({
  result,
  photoUri,
  categories,
}: {
  result: ScanResult;
  photoUri: string;
  categories: AcneCategory[];
}) {
  const { t } = useI18n();
  const hasDetections = result.detectionAreas.length > 0;
  const [mode, setMode] = useState<ImageMode>(hasDetections ? 'detected' : 'original');
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [loadedAspect, setLoadedAspect] = useState<number | null>(null);

  const options: SegmentOption<ImageMode>[] = [
    { value: 'original', label: t.result.original, weight: 'regular', width: 57 },
    { value: 'detected', label: t.result.detected, weight: 'semibold', width: 65 },
  ];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  // The box takes the photo's own shape so it fills the card edge to edge.
  // Boxes are relative to the analysed image, so the overlay is mapped with the
  // same "cover" maths the image uses (identical unless the shape was clamped).
  const sourceAspect = result.image
    ? result.image.width / result.image.height
    : (loadedAspect ?? DEFAULT_ASPECT);
  const boxAspect = Math.min(Math.max(sourceAspect, MIN_PHOTO_ASPECT), MAX_PHOTO_ASPECT);
  const coversWidth = sourceAspect >= boxAspect;
  const renderedWidth = coversWidth ? box.height * sourceAspect : box.width;
  const renderedHeight = coversWidth ? box.height : box.width / sourceAspect;
  const photoRect = {
    x: (box.width - renderedWidth) / 2,
    y: (box.height - renderedHeight) / 2,
    width: renderedWidth,
    height: renderedHeight,
  };
  const showAreas = mode === 'detected' && hasDetections && box.width > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="titleSmall" accessibilityRole="header">
          {hasDetections ? t.result.detectedAreas : t.result.reviewedImage}
        </AppText>
        <SegmentedControl options={options} value={mode} onChange={setMode} />
      </View>

      <View style={[styles.imageBox, { aspectRatio: boxAspect }]} onLayout={onLayout}>
        <Image
          source={{ uri: photoUri }}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          onLoad={(event) => {
            const { width, height } = event.source;
            if (width > 0 && height > 0) setLoadedAspect(width / height);
          }}
          accessibilityIgnoresInvertColors
        />

        {showAreas ? (
          <DetectionOverlay
            width={box.width}
            height={box.height}
            photo={photoRect}
            areas={result.detectionAreas}
          />
        ) : null}

        {showAreas ? (
          <View style={styles.legend}>
            {categories.map((category) => (
              <View key={category} style={styles.legendItem}>
                <LegendDot category={category} outlined />
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
    width: '100%',
    borderRadius: Radius.m,
    backgroundColor: Colors.background.camera,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // With no photo there is no shape to follow.
  imageBoxPlaceholder: {
    height: PLACEHOLDER_HEIGHT,
  },
  noPhoto: {
    gap: Spacing.s,
    paddingHorizontal: Spacing.xl,
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
