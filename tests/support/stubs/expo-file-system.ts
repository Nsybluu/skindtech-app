import { readFileSync } from 'node:fs';

/**
 * Stand-in for expo-file-system's `File`: a real Blob, so `FormData.append` accepts it. It holds
 * three dummy bytes, or the bytes of the file named by `TEST_PHOTO` (only for manual live checks
 * against a running backend; the automated tests use a fake `fetch` and never read a photo).
 */
export class File extends (globalThis as unknown as { File: typeof globalThis.File }).File {
  readonly uri: string;

  constructor(uri: string) {
    const bytes = process.env.TEST_PHOTO ? readFileSync(process.env.TEST_PHOTO) : new Uint8Array([1, 2, 3]);
    super([bytes], uri.split('/').pop() || 'photo.jpg', { type: 'image/jpeg' });
    this.uri = uri;
  }
}
