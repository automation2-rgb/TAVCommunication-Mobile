import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

type ImagePickerAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
};

type ImagePickerModule = typeof import('expo-image-picker');

export type ProfilePhotoSelection = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
};

function isMissingNativeModule(error: unknown, needle: string) {
  return error instanceof Error && error.message.includes(needle);
}

function showRebuildAlert() {
  Alert.alert(
    'Profile photo needs a rebuild',
    'Photo uploads require a native rebuild of the dev client. Run: npx expo run:android (or run:ios), then reopen the app.',
  );
}

function showPickerError(error: unknown) {
  if (isMissingNativeModule(error, 'ExponentImagePicker')) {
    showRebuildAlert();
    return;
  }

  Alert.alert(
    'Could not open picker',
    error instanceof Error ? error.message : 'Something went wrong while opening the photo picker.',
  );
}

async function loadImagePicker(): Promise<ImagePickerModule> {
  return import('expo-image-picker');
}

function assetToSelection(asset: ImagePickerAsset): ProfilePhotoSelection {
  const name = asset.fileName?.trim() || 'profile-photo.jpg';
  const mimeType = asset.mimeType?.trim() || 'image/jpeg';

  return {
    uri: asset.uri,
    name,
    mimeType,
    sizeBytes: typeof asset.fileSize === 'number' ? asset.fileSize : undefined,
  };
}

async function pickFromLibrary(): Promise<ProfilePhotoSelection | null> {
  const ImagePicker = await loadImagePicker();
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photos access needed', 'Enable photo library access to choose a profile photo.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return assetToSelection(result.assets[0]);
}

async function pickFromCamera(): Promise<ProfilePhotoSelection | null> {
  const ImagePicker = await loadImagePicker();
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera access needed', 'Enable camera access to take a profile photo.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return assetToSelection(result.assets[0]);
}

export function useProfileAvatarPicker() {
  const runPicker = useCallback(async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        return await pickFromCamera();
      }
      return await pickFromLibrary();
    } catch (error) {
      showPickerError(error);
      return null;
    }
  }, []);

  const promptForPhoto = useCallback(
    (options: { hasPhoto: boolean; onPick: (selection: ProfilePhotoSelection) => void; onRemove?: () => void }) => {
      const chooseCamera = () => {
        void runPicker('camera').then((selection) => {
          if (selection) {
            options.onPick(selection);
          }
        });
      };

      const chooseLibrary = () => {
        void runPicker('library').then((selection) => {
          if (selection) {
            options.onPick(selection);
          }
        });
      };

      if (Platform.OS === 'ios') {
        const actionOptions = options.hasPhoto
          ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
          : ['Take Photo', 'Choose from Library', 'Cancel'];
        const cancelButtonIndex = actionOptions.length - 1;
        const destructiveButtonIndex = options.hasPhoto ? 2 : undefined;

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: actionOptions,
            cancelButtonIndex,
            destructiveButtonIndex,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              chooseCamera();
              return;
            }
            if (buttonIndex === 1) {
              chooseLibrary();
              return;
            }
            if (options.hasPhoto && buttonIndex === 2) {
              options.onRemove?.();
            }
          },
        );
        return;
      }

      Alert.alert(
        'Profile photo',
        undefined,
        [
          { text: 'Take Photo', onPress: chooseCamera },
          { text: 'Choose from Library', onPress: chooseLibrary },
          ...(options.hasPhoto
            ? [{ text: 'Remove Photo', style: 'destructive' as const, onPress: () => options.onRemove?.() }]
            : []),
          { text: 'Cancel', style: 'cancel' as const },
        ],
        { cancelable: true },
      );
    },
    [runPicker],
  );

  return { promptForPhoto };
}
