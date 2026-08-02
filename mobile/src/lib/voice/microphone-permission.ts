import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { PermissionsAndroid, Platform } from 'react-native';

export type MicrophoneAccess = 'granted' | 'denied' | 'unsupported';

export function getMicrophoneDeniedMessage(): string {
  return 'Microphone access is required to place calls. Enable it in Settings and try again.';
}

export async function ensureMicrophoneAccess(): Promise<MicrophoneAccess> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
      title: 'Microphone access',
      message: 'TAV Communication needs microphone access for voice calls.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }

  if (Platform.OS === 'ios') {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted ? 'granted' : 'denied';
  }

  return 'unsupported';
}

export async function getMicrophoneAccessStatus(): Promise<MicrophoneAccess> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return granted ? 'granted' : 'denied';
  }

  if (Platform.OS === 'ios') {
    const { granted } = await getRecordingPermissionsAsync();
    return granted ? 'granted' : 'denied';
  }

  return 'unsupported';
}
