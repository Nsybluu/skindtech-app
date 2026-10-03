/**
 * Tailwind for NativeWind v4. The colour, radius and type tokens come from tailwind.theme.json,
 * which is generated from src/constants (`npm run theme`) and checked by tests/tailwind-theme.test.ts.
 *
 * Spacing is Tailwind's stock scale: metro.config.js inlines `rem` as 16, so `p-1` = 4pt,
 * `p-4` = 16pt and the app's 4pt grid is the default scale.
 */
const theme = require('./tailwind.theme.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  // AppText assembles these names at run time (`text-${variant}`, `font-noto-${weight}`), so the
  // scanner cannot see them in the source.
  safelist: [
    ...Object.keys(theme.fontSize).map((name) => `text-${name}`),
    ...Object.keys(theme.fontFamily).map((name) => `font-${name}`),
  ],
  presets: [require('nativewind/preset')],
  theme: {
    // Replaced, not extended: only the project's own palette, radii and type scale exist, so a
    // stock class such as `text-blue-500` or `font-bold` fails the class-existence test.
    colors: theme.colors,
    borderRadius: theme.borderRadius,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    fontWeight: {},
    extend: {
      maxWidth: { content: '480px' },
    },
  },
  plugins: [],
};
