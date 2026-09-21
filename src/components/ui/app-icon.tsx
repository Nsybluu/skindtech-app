import { Colors } from '@/constants/colors';

import type { LucideIcon } from './icons';

/**
 * lucide icons are drawn on a 24-unit grid and scale their stroke with `size`.
 * 1.8 gives about 1.2px lines at 16px and 1.8px at 24px, the weight of the
 * original Figma icons.
 */
export const ICON_STROKE = 1.8;

type AppIconProps = {
  icon: LucideIcon;
  size?: number;
  /** Defaults to the brand rose used by most icons. */
  color?: string;
  strokeWidth?: number;
};

/** Every icon in the app goes through here so size, colour and stroke stay consistent. */
export function AppIcon({
  icon: Glyph,
  size = 18,
  color = Colors.brand.primary,
  strokeWidth = ICON_STROKE,
}: AppIconProps) {
  return <Glyph size={size} color={color} strokeWidth={strokeWidth} />;
}
