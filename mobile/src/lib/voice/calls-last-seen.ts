import AsyncStorage from '@react-native-async-storage/async-storage';

/** Mirrors web `tav-voice:calls-last-seen-at`. */
export const CALLS_LAST_SEEN_STORAGE_KEY = 'tav-voice:calls-last-seen-at';

export async function getCallsLastSeenAt(): Promise<string | null> {
  const value = await AsyncStorage.getItem(CALLS_LAST_SEEN_STORAGE_KEY);
  return value?.trim() ? value : null;
}

export async function setCallsLastSeenAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(CALLS_LAST_SEEN_STORAGE_KEY, iso);
}

export async function markCallsSeenNow(): Promise<string> {
  const now = new Date().toISOString();
  await setCallsLastSeenAt(now);
  return now;
}
