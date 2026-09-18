import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Figma frames assume a 44 pt status bar above the content. */
const DESIGN_STATUS_BAR_HEIGHT = 44;
/** Keeps content clear of the status bar on devices that report no top inset. */
const MIN_TOP_INSET = 20;

/**
 * Translates Figma's fixed 390 × 844 coordinates into safe-area aware values.
 *
 * - `top(y)`: distance from the top of the screen for something placed at `y` in Figma.
 * - `bottom(padding)`: bottom padding that never goes under the home indicator.
 */
export function useDesignInsets() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    top: (figmaY: number) => Math.max(insets.top, MIN_TOP_INSET) + figmaY - DESIGN_STATUS_BAR_HEIGHT,
    bottom: (figmaPadding: number) => Math.max(insets.bottom, figmaPadding),
  };
}
