const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Figma icons are exported as SVG files and imported as React components
 * through react-native-svg-transformer; NativeWind compiles Tailwind classes on top of that.
 * `inlineRem: 16` makes Tailwind's stock spacing the app's 4pt grid (`p-1` = 4, `p-4` = 16).
 */
module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return withNativeWind(config, { input: './global.css', inlineRem: 16 });
})();
