/**
 * Third-party components that take a `style` prop but are not React Native built-ins: NativeWind
 * has to be told once that their `className` becomes that `style`. Import them from here (not from
 * the package) so the registration has always run.
 */
import { CameraView } from 'expo-camera';
import { GlassView } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

cssInterop(Image, { className: 'style' });
cssInterop(CameraView, { className: 'style' });
cssInterop(GlassView, { className: 'style' });
cssInterop(Svg, { className: 'style' });

export { CameraView, GlassView, Image, Svg };
