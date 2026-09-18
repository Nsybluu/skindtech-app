import { StyleSheet } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import type { AcneDetectionArea } from '@/types/scan';

/** Rect of the photo inside the preview box (the detections are relative to it). */
export type PhotoRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DetectionOverlayProps = {
  width: number;
  height: number;
  photo: PhotoRect;
  areas: AcneDetectionArea[];
};

const BRACKET_INSET_X = 15;
const BRACKET_INSET_TOP = 18;
const BRACKET_INSET_BOTTOM = 43;
const BRACKET_LENGTH = 10;

/**
 * Scan framing brackets plus the detected-area ellipses.
 * Areas come from the (currently mocked) detection data, so real YOLO boxes
 * can be rendered by passing them through unchanged.
 */
export function DetectionOverlay({ width, height, photo, areas }: DetectionOverlayProps) {
  const right = width - BRACKET_INSET_X;
  const bottom = height - BRACKET_INSET_BOTTOM;
  const brackets = [
    `M${BRACKET_INSET_X} ${BRACKET_INSET_TOP + BRACKET_LENGTH}V${BRACKET_INSET_TOP}H${BRACKET_INSET_X + BRACKET_LENGTH}`,
    `M${right - BRACKET_LENGTH} ${BRACKET_INSET_TOP}H${right}V${BRACKET_INSET_TOP + BRACKET_LENGTH}`,
    `M${BRACKET_INSET_X} ${bottom - BRACKET_LENGTH}V${bottom}H${BRACKET_INSET_X + BRACKET_LENGTH}`,
    `M${right - BRACKET_LENGTH} ${bottom}H${right}V${bottom - BRACKET_LENGTH}`,
  ].join(' ');

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Path d={brackets} stroke={Colors.brand.accent} strokeWidth={2} strokeLinecap="round" fill="none" />

      {areas.map((area) => {
        const rx = (area.box.width * photo.width) / 2;
        const ry = (area.box.height * photo.height) / 2;
        const comedonal = area.category === 'comedonal';

        return (
          <Ellipse
            key={area.id}
            cx={photo.x + area.box.x * photo.width + rx}
            cy={photo.y + area.box.y * photo.height + ry}
            rx={rx}
            ry={ry}
            fill={comedonal ? Colors.brand.peach : Colors.brand.primary}
            fillOpacity={comedonal ? 0.19 : 0.22}
            stroke={comedonal ? Colors.brand.peach : Colors.brand.accent}
            strokeWidth={1.2}
            strokeDasharray={comedonal ? '4 4' : undefined}
          />
        );
      })}
    </Svg>
  );
}
