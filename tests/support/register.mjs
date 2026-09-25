// Loaded with `node --import` before every test file: teaches Node to run the app's own
// TypeScript sources (path alias, extension-less imports, React Native / Expo modules stubbed).
import { register } from 'node:module';

// The app reads its API address at import time; tests talk to a fake `fetch`, never a network.
process.env.EXPO_PUBLIC_API_URL ??= 'http://api.test';
globalThis.__DEV__ = false;

register('./hooks.mjs', import.meta.url);
