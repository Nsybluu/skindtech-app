/**
 * SKINDTECH color tokens — values taken from the Figma frames (light theme only).
 *
 * The design leans heavily on a few base hues at different opacities, so those
 * are exposed as alpha helpers next to the named tokens.
 */

const rgba = (r: number, g: number, b: number) => (alpha: number) =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

/** Base hues used with opacity throughout the design. */
export const Alpha = {
  /** #C95961 — brand rose */
  rose: rgba(201, 89, 97),
  /** #B08F85 — warm taupe used for borders and dividers */
  taupe: rgba(176, 143, 133),
  /** #FDEAEB — blush surface tint */
  blush: rgba(253, 234, 235),
  /** #F5B7A6 — peach accent (comedonal acne, morning routine) */
  peach: rgba(245, 183, 166),
  white: rgba(255, 255, 255),
  /** #1B1513 — ink, used for overlays */
  ink: rgba(27, 21, 19),
} as const;

export const Colors = {
  text: {
    primary: '#1B1513',
    secondary: '#523D38',
    muted: '#79645E',
    tagline: '#3C2F2A',
    label: '#302421',
    footer: '#4F3C37',
    google: '#141414',
    onBrand: '#FFFFFF',
    onDarkMuted: Alpha.white(0.72),
  },
  brand: {
    primary: '#C95961',
    /** Slightly brighter rose used by filters, language apply and the About logo. */
    vivid: '#CE5862',
    gradientStart: '#D6656C',
    gradientEnd: '#E27C7F',
    accent: '#E1787F',
    peach: '#F5B7A6',
  },
  icon: {
    /** Dark warm ink for neutral icons (back chevron, password eye). */
    strong: '#4A3B35',
  },
  background: {
    base: '#FFF9F7',
    gradientStart: '#FDF1EF',
    gradientMid: '#FFF9F7',
    gradientEnd: '#FCE9E9',
    camera: '#1B1513',
    sheet: '#FFFDFC',
    avatar: '#FFE8E8',
  },
  border: {
    input: 'rgba(171, 122, 112, 0.62)',
    button: Alpha.taupe(0.72),
    card: Alpha.taupe(0.34),
    subtle: Alpha.taupe(0.26),
    divider: Alpha.taupe(0.2),
    brand: Alpha.rose(0.22),
    brandStrong: Alpha.rose(0.3),
  },
  surface: {
    input: Alpha.white(0.42),
    card: Alpha.white(0.58),
    cardStrong: Alpha.white(0.74),
    list: Alpha.white(0.78),
    secondaryButton: Alpha.white(0.7),
    bar: Alpha.white(0.94),
    notice: Alpha.rose(0.08),
    iconTint: Alpha.rose(0.12),
    overlayChip: Alpha.white(0.12),
    backdrop: Alpha.ink(0.34),
  },
  success: {
    surface: '#F2F8F4',
    surfaceAlt: '#EFF7F2',
    border: '#D3EBDD',
    text: '#48765E',
  },
  progress: {
    surface: '#FFF5F6',
    border: '#F7D5D8',
    title: '#271D1F',
    track: '#F4DBDD',
    text: '#675759',
  },
  error: {
    iconSurface: '#FFEBED',
    iconBorder: '#F8CDD1',
    title: '#271D1F',
    body: '#705E61',
    cardBorder: '#F2D6D9',
    text: '#5C4D4F',
    noticeSurface: '#FFF3F4',
    noticeBorder: '#F7D8DB',
  },
  history: {
    moderate: '#FCECEC',
    mild: '#FDF2F0',
    severe: '#F9E0E2',
  },
} as const;

export const Gradients = {
  /** Screen background (100° linear gradient on every frame). */
  screen: `linear-gradient(100.19deg,${Colors.background.gradientStart} 0%, ${Colors.background.gradientMid} 52%, ${Colors.background.gradientEnd} 100%)`,
  /** Primary button fill. */
  primary: `linear-gradient(90deg, ${Colors.brand.gradientStart} 0%, ${Colors.brand.gradientEnd} 100%)`,
  /** Home "Start a skin check" card. */
  scanCard: 'linear-gradient(90deg, #FFF9F7 0%, #F9D8D6 100%)',
} as const;
