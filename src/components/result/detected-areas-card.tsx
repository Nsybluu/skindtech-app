import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText } from '@/components/ui/app-text';
import { ImageOffIcon } from '@/components/ui/icons';
import { Image } from '@/components/ui/styled';
import { Colors } from '@/constants/colors';
import { useI18n } from '@/i18n/i18n-provider';
import type { AcneCategory, ScanResult } from '@/types/scan';

import { DetectionOverlay } from './detection-overlay';
import { LegendDot } from './legend-dot';
import { SegmentedControl, type SegmentOption } from './segmented-control';

type ImageMode = 'original' | 'detected';

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
    <View className="gap-3 rounded-lg border border-line-subtle bg-surface-card-strong p-4">
      <View className="min-h-[26px] flex-row items-center justify-between gap-2">
        <AppText variant="cardTitle" accessibilityRole="header">
          {count > 0 ? t.result.detectedAreas : t.result.reviewedImage}
        </AppText>
      </View>
      {/* With no photo there is no shape to follow. */}
      <View className="h-[188px] w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-canvas-camera px-5">
        <AppIcon icon={ImageOffIcon} size={26} color={Colors.text.onBrand} />
        <AppText variant="label" className="text-center text-fg-on-brand">
          {t.result.photoUnavailableTitle}
        </AppText>
        <AppText variant="caption" className="text-center text-fg-on-dark-muted">
          {t.result.photoUnavailableBody}
        </AppText>
      </View>
      <AppText variant="caption" className="text-fg-secondary">
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
    { value: 'original', label: t.result.original },
    { value: 'detected', label: t.result.detected },
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
    <View className="gap-3 rounded-lg border border-line-subtle bg-surface-card-strong p-4">
      <View className="min-h-[26px] flex-row items-center justify-between gap-2">
        <AppText variant="cardTitle" accessibilityRole="header">
          {hasDetections ? t.result.detectedAreas : t.result.reviewedImage}
        </AppText>
        <SegmentedControl options={options} value={mode} onChange={setMode} />
      </View>

      {/* The box takes the photo's own shape (runtime aspect ratio). */}
      <View
        className="w-full items-center justify-center overflow-hidden rounded-md bg-canvas-camera"
        style={{ aspectRatio: boxAspect }}
        onLayout={onLayout}>
        <Image
          source={{ uri: photoUri }}
          contentFit="cover"
          className="absolute inset-0"
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
          <View className="absolute bottom-3 left-3 right-3 min-h-8 flex-row items-center justify-center gap-5 rounded-md bg-ink/[0.78] px-4">
            {categories.map((category) => (
              <View key={category} className="flex-row items-center gap-2">
                <LegendDot category={category} outlined />
                <AppText variant="caption" numberOfLines={1} className="text-fg-on-brand">
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
