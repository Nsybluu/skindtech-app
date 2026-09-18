/** Spacing, radius and layout tokens — a 4 pt rhythm shared by every screen. */

export const Spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  sheet: 28,
  pill: 999,
} as const;

export const Layout = {
  /** Horizontal padding for in-app screens. */
  screenPadding: 20,
  /** Horizontal padding for the authentication screens. */
  authPadding: 24,
  /** Keeps content readable on tablets / large phones. */
  maxContentWidth: 480,
  headerHeight: 44,
  iconButton: 40,
  buttonHeight: 56,
  primaryButtonHeight: 56,
  inputHeight: 56,
  /** Height reserved under scroll content for the floating tab bar. */
  tabBarClearance: 112,
} as const;

export const Shadows = {
  primary: '0px 8px 20px -8px rgba(166, 69, 77, 0.35)',
  google: '0px 4px 14px -7px rgba(66, 36, 31, 0.08)',
  camera: '0px 6px 18px -6px rgba(66, 36, 31, 0.12)',
  barUp: '0px -4px 16px 0px rgba(66, 36, 31, 0.08)',
  navFloating: '0px 10px 28px -10px rgba(27, 21, 19, 0.45)',
  navFloatingLight: '0px 12px 30px -10px rgba(66, 36, 31, 0.4)',
  modalUp: '0px -6px 18px -4px rgba(66, 36, 31, 0.16)',
} as const;
