import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import {
  type ComposerFile,
  canonicalizeMmsMimeType,
  defaultFilename,
  normalizeMimeType,
  validateComposerFiles,
} from '@/lib/messaging/mms-policy';
import { readComposerFileSize } from '@/lib/messaging/mms-upload';

type ImagePickerAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

type ImagePickerModule = typeof import('expo-image-picker');

function isMissingNativeModule(error: unknown, needle: string) {
  return error instanceof Error && error.message.includes(needle);
}

function showRebuildAlert() {
  Alert.alert(
    'Attachments need a rebuild',
    'Photo attachments require a native rebuild of the dev client. Run: npx expo run:android (or run:ios), then reopen the app.',
  );
}

function showPickerError(error: unknown) {
  if (isMissingNativeModule(error, 'ExponentImagePicker')) {
    showRebuildAlert();
    return;
  }

  Alert.alert(
    'Could not open picker',
    error instanceof Error ? error.message : 'Something went wrong while opening attachments.',
  );
}

async function loadImagePicker(): Promise<ImagePickerModule> {
  return import('expo-image-picker');
}

function assetToComposerFile(asset: ImagePickerAsset, index: number): ComposerFile {
  const name = asset.fileName ?? defaultFilename(asset.uri, asset.mimeType ?? 'image/jpeg', index);
  const type = canonicalizeMmsMimeType(asset.mimeType, name) || normalizeMimeType(asset.mimeType ?? 'image/jpeg');
  const size =
    typeof asset.fileSize === 'number' ? asset.fileSize : readComposerFileSize(asset.uri);

  return {
    uri: asset.uri,
    name,
    type,
    size,
  };
}

export function useComposerAttachments() {
  const [files, setFiles] = useState<ComposerFile[]>([]);

  const appendFiles = useCallback((incoming: ComposerFile[]) => {
    const { accepted, error } = validateComposerFiles(files, incoming);
    if (error) {
      Alert.alert('Attachment not allowed', error);
      return false;
    }

    setFiles((current) => [...current, ...accepted]);
    return true;
  }, [files]);

  const removeFile = useCallback((index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const pickFromLibrary = useCallback(async () => {
    try {
      const ImagePicker = await loadImagePicker();
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos access needed', 'Enable photo library access to attach images or videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const incoming = result.assets.map((asset, index) => assetToComposerFile(asset, index));
      appendFiles(incoming);
    } catch (error) {
      showPickerError(error);
    }
  }, [appendFiles]);

  const pickFromCamera = useCallback(async () => {
    try {
      const ImagePicker = await loadImagePicker();
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Enable camera access to take a photo or video.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const incoming = result.assets.map((asset, index) => assetToComposerFile(asset, index));
      appendFiles(incoming);
    } catch (error) {
      showPickerError(error);
    }
  }, [appendFiles]);

  return {
    files,
    appendFiles,
    removeFile,
    clearFiles,
    pickFromLibrary,
    pickFromCamera,
  };
}
