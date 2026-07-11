import AsyncStorage from '@react-native-async-storage/async-storage';

/** Mirrors web localStorage key for inbound notification sound. */
export const NOTIFY_SOUND_STORAGE_KEY = 'tav-sms:notify-sound';

const DEFAULT_NOTIFY_SOUND_ENABLED = true;

let cachedNotifySoundEnabled: boolean | null = null;

export function getCachedNotifySoundEnabled() {
  return cachedNotifySoundEnabled ?? DEFAULT_NOTIFY_SOUND_ENABLED;
}

export async function getNotifySoundEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFY_SOUND_STORAGE_KEY);
    if (raw === null) {
      cachedNotifySoundEnabled = DEFAULT_NOTIFY_SOUND_ENABLED;
      return DEFAULT_NOTIFY_SOUND_ENABLED;
    }

    const enabled = raw !== 'false';
    cachedNotifySoundEnabled = enabled;
    return enabled;
  } catch {
    return getCachedNotifySoundEnabled();
  }
}

export async function setNotifySoundEnabled(enabled: boolean): Promise<void> {
  cachedNotifySoundEnabled = enabled;
  try {
    await AsyncStorage.setItem(NOTIFY_SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Preference stays in memory for this session if persistence fails.
  }
}

/** Warm the in-memory cache used by the notification handler. */
export async function hydrateNotifySoundPreference(): Promise<boolean> {
  return getNotifySoundEnabled();
}
