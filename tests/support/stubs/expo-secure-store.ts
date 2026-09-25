const store = new Map<string, string>();

export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'when-unlocked-this-device-only';
export type SecureStoreOptions = Record<string, unknown>;

export async function getItemAsync(key: string): Promise<string | null> {
  return store.get(key) ?? null;
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}
/** Test helper: what is currently stored (a copy). */
export const __peek = (): Record<string, string> => Object.fromEntries(store);
