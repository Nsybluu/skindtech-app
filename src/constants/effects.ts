import type { ViewStyle } from 'react-native';

import { Gradients } from './colors';
import { Shadows } from './spacing';

/**
 * Gradient fills and box shadows, the one kind of visual style that is not a Tailwind class.
 *
 * NativeWind v4 renders its own `bg-gradient-*` / `shadow-*` classes differently from React Native's
 * `experimental_backgroundImage` and `boxShadow` (a class gradient draws nothing, a class shadow has
 * another spread and offset), so the design's exact values live here and are applied as
 * `style={Effects.x}` next to the layout classes. tests/nativewind.test.ts keeps every other
 * `style` prop out of the source.
 */
export const Effects = {
  gradientScreen: { experimental_backgroundImage: Gradients.screen },
  gradientPrimary: { experimental_backgroundImage: Gradients.primary },
  gradientScanCard: { experimental_backgroundImage: Gradients.scanCard },
  shadowPrimary: { boxShadow: Shadows.primary },
  shadowGoogle: { boxShadow: Shadows.google },
  shadowCamera: { boxShadow: Shadows.camera },
  shadowBarUp: { boxShadow: Shadows.barUp },
  shadowModalUp: { boxShadow: Shadows.modalUp },
  shadowNavFloating: { boxShadow: Shadows.navFloating },
  shadowNavFloatingLight: { boxShadow: Shadows.navFloatingLight },
  shadowNavHalo: { boxShadow: Shadows.navHalo },
  /** Primary button: rose gradient with its soft shadow. */
  primaryButton: { experimental_backgroundImage: Gradients.primary, boxShadow: Shadows.primary },
  /** Home "Start a skin check" card. */
  scanCard: { experimental_backgroundImage: Gradients.scanCard, boxShadow: Shadows.primary },
} as const satisfies Record<string, ViewStyle>;
