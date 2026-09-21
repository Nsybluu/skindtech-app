/**
 * Google OAuth client IDs. These are public identifiers, not secrets: never add a
 * client secret to the app.
 *
 * - The Web (server) client ID is the audience of the ID token the backend verifies.
 *   It is used on both platforms.
 * - The iOS client ID drives the native iOS flow. Its reversed form is the URL
 *   scheme registered in `app.json` (plugin `react-native-nitro-google-signin`).
 * - Android needs no ID at runtime: Google matches the Android OAuth client by the
 *   package name `com.nsybluu.skindtech` and the signing certificate's SHA-1.
 */
export const GOOGLE_WEB_CLIENT_ID =
  '892241187499-7eupt78rpc7i6kn4klb6fqtv86f20d2t.apps.googleusercontent.com';

export const GOOGLE_IOS_CLIENT_ID =
  '892241187499-momvr58qiqifnh7s04uk88qr1o6gg6dg.apps.googleusercontent.com';
