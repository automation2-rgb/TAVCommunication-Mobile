/**
 * Notify-sound preference helpers.
 *
 * TEMP: In-memory only (no AsyncStorage) so the existing native APK can load
 * Metro JS without a rebuild. Restore `@react-native-async-storage/async-storage`
 * persistence after the next native build that links that module.
 */

/** Mirrors web localStorage key for inbound notification sound. */
export const NOTIFY_SOUND_STORAGE_KEY = 'tav-sms:notify-sound';

const DEFAULT_NOTIFY_SOUND_ENABLED = true;

let cachedNotifySoundEnabled: boolean | null = null;

export function getCachedNotifySoundEnabled() {
  return cachedNotifySoundEnabled ?? DEFAULT_NOTIFY_SOUND_ENABLED;
}

export async function getNotifySoundEnabled(): Promise<boolean> {
  if (cachedNotifySoundEnabled === null) {
    cachedNotifySoundEnabled = DEFAULT_NOTIFY_SOUND_ENABLED;
  }
  return cachedNotifySoundEnabled;
}

export async function setNotifySoundEnabled(enabled: boolean): Promise<void> {
  cachedNotifySoundEnabled = enabled;
}

/** Warm the in-memory cache used by the notification handler. */
export async function hydrateNotifySoundPreference(): Promise<boolean> {
  return getNotifySoundEnabled();
}
