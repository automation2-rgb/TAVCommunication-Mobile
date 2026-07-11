import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { apiFetch } from '@/lib/api-client';
import {
  getCachedNotifySoundEnabled,
  hydrateNotifySoundPreference,
} from '@/lib/settings/local-preferences';

export const PUSH_CHANNEL_ID = 'inbound-sms';
const REGISTERED_TOKEN_KEY = 'tav_mobile_push_token_registered';

export type PushPlatform = 'ios' | 'android';
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PushDeepLink = {
  inboxId: string;
  threadId: string;
  messageId?: string;
};

let cachedDeviceToken: string | null = null;
let soundPreferenceHydrated = false;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: getCachedNotifySoundEnabled(),
      shouldSetBadge: true,
    }),
  });
}

async function ensureSoundPreferenceHydrated() {
  if (soundPreferenceHydrated) {
    return;
  }

  await hydrateNotifySoundPreference();
  soundPreferenceHydrated = true;
}

export function isPushSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getCachedDevicePushToken() {
  return cachedDeviceToken;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: 'Inbound messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
    // Omit `sound` to use the system default; a custom value must be a bundled file name.
  });
}

export async function requestPushPermission() {
  if (!isPushSupported()) {
    return false;
  }

  await ensureAndroidNotificationChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return (
    requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function mapPermissionResponse(
  response: Notifications.NotificationPermissionsStatus,
): NotificationPermissionStatus {
  if (response.granted || response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return 'granted';
  }

  if (response.status === Notifications.PermissionStatus.DENIED) {
    return 'denied';
  }

  if (response.canAskAgain === false) {
    return 'denied';
  }

  return 'undetermined';
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!isPushSupported()) {
    return 'denied';
  }

  const current = await Notifications.getPermissionsAsync();
  return mapPermissionResponse(current);
}

export async function openSystemNotificationSettings() {
  await Linking.openSettings();
}

export function getPushPlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export async function fetchDevicePushToken() {
  if (!isPushSupported()) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();
  const value = token.data?.trim();
  if (!value) {
    return null;
  }

  cachedDeviceToken = value;
  return value;
}

async function getRegisteredToken() {
  try {
    return await SecureStore.getItemAsync(REGISTERED_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setRegisteredToken(token: string | null) {
  try {
    if (token) {
      await SecureStore.setItemAsync(REGISTERED_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REGISTERED_TOKEN_KEY);
    }
  } catch {
    // Ignore secure-store failures; registration can retry on next launch.
  }
}

export async function registerDevicePushToken(token: string) {
  const platform = getPushPlatform();

  const response = await apiFetch('/api/push/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  });

  if (!response.ok) {
    throw new Error(`Push register failed (${response.status})`);
  }

  cachedDeviceToken = token;
  await setRegisteredToken(token);
}

export async function unregisterDevicePushToken(token?: string | null) {
  const payloadToken = token ?? cachedDeviceToken;
  const body = payloadToken ? JSON.stringify({ token: payloadToken }) : undefined;

  try {
    await apiFetch('/api/push/register', {
      method: 'DELETE',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
    });
  } finally {
    cachedDeviceToken = null;
    await setRegisteredToken(null);
  }
}

export async function syncDevicePushRegistration() {
  if (!isPushSupported()) {
    return null;
  }

  await ensureSoundPreferenceHydrated();

  const granted = await requestPushPermission();
  if (!granted) {
    return null;
  }

  const token = await fetchDevicePushToken();
  if (!token) {
    return null;
  }

  const registeredToken = await getRegisteredToken();
  if (registeredToken === token) {
    cachedDeviceToken = token;
    return token;
  }

  await registerDevicePushToken(token);
  return token;
}

export function parsePushNotificationData(data: Record<string, unknown> | undefined): PushDeepLink | null {
  if (!data) {
    return null;
  }

  const inboxId = readStringField(data, 'inbox_id');
  const threadId = readStringField(data, 'thread_id');
  if (!inboxId || !threadId) {
    return null;
  }

  const messageId = readStringField(data, 'message_id') ?? undefined;
  return { inboxId, threadId, messageId };
}

function readStringField(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
