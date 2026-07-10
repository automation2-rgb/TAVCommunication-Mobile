import * as Linking from 'expo-linking';

export async function openAttachmentExternally(url: string) {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Unable to open this attachment on your device.');
  }
  await Linking.openURL(url);
}
