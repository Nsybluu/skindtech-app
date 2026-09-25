import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'src');
const STUBS = join(ROOT, 'tests', 'support', 'stubs');

/** Native modules the services import; their behaviour is replaced by small in-memory stand-ins. */
const STUBBED = {
  'react-native': 'react-native.ts',
  'expo-secure-store': 'expo-secure-store.ts',
  'expo-device': 'expo-device.ts',
  'expo-file-system': 'expo-file-system.ts',
};

const EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

function withExtension(path) {
  if (existsSync(path) && statSync(path).isFile()) return path;
  for (const extension of EXTENSIONS) {
    if (existsSync(path + extension)) return path + extension;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (STUBBED[specifier]) {
    return { url: pathToFileURL(join(STUBS, STUBBED[specifier])).href, shortCircuit: true };
  }

  let base = null;
  if (specifier.startsWith('@/')) base = join(SRC, specifier.slice(2));
  else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    base = join(dirname(fileURLToPath(context.parentURL)), specifier);
  }

  if (base) {
    const file = withExtension(base);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
