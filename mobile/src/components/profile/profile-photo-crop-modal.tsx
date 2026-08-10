import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { compressProfileImage } from '@/lib/profile/compress-profile-image';
import {
  clampProfilePhotoTransform,
  computeProfilePhotoCropRect,
  getMinimumCoverScale,
  loadImageDimensions,
} from '@/lib/profile/crop-profile-image';
import { tavColors } from '@/lib/theme';

type ProfilePhotoCropModalProps = {
  visible: boolean;
  uri: string | null;
  fileName: string;
  mimeType: string;
  onCancel: () => void;
  onConfirm: (result: { uri: string; name: string; mimeType: string }) => void | Promise<void>;
};

export function ProfilePhotoCropModal({
  visible,
  uri,
  fileName,
  mimeType,
  onCancel,
  onConfirm,
}: ProfilePhotoCropModalProps) {
  'use no memo';

  const { width: windowWidth } = useWindowDimensions();
  const cropSize = useMemo(() => Math.min(windowWidth - 48, 320), [windowWidth]);

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const imageWidth = useSharedValue(0);
  const imageHeight = useSharedValue(0);
  const minScaleShared = useSharedValue(1);
  const cropSizeShared = useSharedValue(cropSize);

  useEffect(() => {
    cropSizeShared.value = cropSize;
  }, [cropSize, cropSizeShared]);

  useEffect(() => {
    if (!visible || !uri) {
      setImageSize(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void loadImageDimensions(uri)
      .then((dimensions) => {
        if (cancelled) {
          return;
        }

        const initialScale = getMinimumCoverScale(dimensions.width, dimensions.height, cropSize);
        minScaleShared.value = initialScale;
        scale.value = initialScale;
        savedScale.value = initialScale;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        imageWidth.value = dimensions.width;
        imageHeight.value = dimensions.height;
        setImageSize(dimensions);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Unable to load the selected photo.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    cropSize,
    cropSizeShared,
    imageHeight,
    imageWidth,
    minScaleShared,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
    uri,
    visible,
  ]);

  const clampTransform = useCallback(() => {
    if (!imageSize) {
      return;
    }

    const clamped = clampProfilePhotoTransform({
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      cropSize,
      scale: scale.value,
      translateX: translateX.value,
      translateY: translateY.value,
    });

    scale.value = clamped.scale;
    savedScale.value = clamped.scale;
    translateX.value = clamped.translateX;
    translateY.value = clamped.translateY;
    savedTranslateX.value = clamped.translateX;
    savedTranslateY.value = clamped.translateY;
  }, [cropSize, imageSize, savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY]);

  const composedGesture = useMemo(
    () =>
      Gesture.Simultaneous(
        Gesture.Pan()
          .onBegin(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
          })
          .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
          })
          .onEnd(() => {
            runOnJS(clampTransform)();
          }),
        Gesture.Pinch()
          .onBegin(() => {
            savedScale.value = scale.value;
          })
          .onUpdate((event) => {
            const nextScale = savedScale.value * event.scale;
            const minScaleValue = minScaleShared.value;
            scale.value = Math.min(Math.max(nextScale, minScaleValue), minScaleValue * 4);
          })
          .onEnd(() => {
            runOnJS(clampTransform)();
          }),
      ),
    [
      clampTransform,
      minScaleShared,
      savedScale,
      savedTranslateX,
      savedTranslateY,
      scale,
      translateX,
      translateY,
    ],
  );

  const animatedImageStyle = useAnimatedStyle(() => {
    const displayWidth = imageWidth.value * scale.value;
    const displayHeight = imageHeight.value * scale.value;
    const crop = cropSizeShared.value;

    return {
      position: 'absolute',
      width: displayWidth,
      height: displayHeight,
      left: (crop - displayWidth) / 2 + translateX.value,
      top: (crop - displayHeight) / 2 + translateY.value,
    };
  });

  const handleConfirm = async () => {
    if (!uri || !imageSize || isSaving) {
      return;
    }

    clampTransform();

    setIsSaving(true);
    try {
      const crop = computeProfilePhotoCropRect({
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        cropSize,
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      });

      const compressed = await compressProfileImage({
        uri,
        name: fileName,
        mimeType,
        crop,
      });

      await onConfirm({
        uri: compressed.uri,
        name: 'profile-photo.jpg',
        mimeType: 'image/jpeg',
      });
      compressed.cleanup();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to prepare the profile photo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onCancel} visible={visible}>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onCancel}
              style={styles.headerButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Profile photo</Text>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || isLoading || !imageSize || Boolean(loadError)}
              onPress={() => {
                void handleConfirm();
              }}
              style={styles.headerButton}>
              {isSaving ? (
                <ActivityIndicator color={tavColors.blue} size="small" />
              ) : (
                <Text style={styles.addText}>Add</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.stage}>
            <View style={[styles.cropWindow, { width: cropSize, height: cropSize }]}>
              {isLoading ? (
                <ActivityIndicator color={tavColors.white} />
              ) : loadError ? (
                <Text style={styles.errorText}>{loadError}</Text>
              ) : uri && imageSize ? (
                <GestureDetector gesture={composedGesture}>
                  <Animated.View style={styles.cropSurface}>
                    <Animated.View style={animatedImageStyle}>
                      <Image contentFit="fill" source={{ uri }} style={styles.image} />
                    </Animated.View>
                  </Animated.View>
                </GestureDetector>
              ) : null}
            </View>
          </View>

          <Text style={styles.hint}>Pinch and drag to adjust your photo.</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: tavColors.zinc950,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerButton: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  title: {
    color: tavColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelText: {
    color: tavColors.zinc300,
    fontSize: 16,
  },
  addText: {
    color: tavColors.blue,
    fontSize: 16,
    fontWeight: '700',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cropWindow: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: tavColors.zinc900,
  },
  cropSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hint: {
    textAlign: 'center',
    color: tavColors.zinc400,
    fontSize: 14,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});
