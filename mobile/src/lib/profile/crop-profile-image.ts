import { Image } from 'react-native';

export type ProfilePhotoCropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export function getMinimumCoverScale(imageWidth: number, imageHeight: number, cropSize: number) {
  return Math.max(cropSize / imageWidth, cropSize / imageHeight);
}

export function clampProfilePhotoTransform(params: {
  imageWidth: number;
  imageHeight: number;
  cropSize: number;
  scale: number;
  translateX: number;
  translateY: number;
}) {
  const minScale = getMinimumCoverScale(params.imageWidth, params.imageHeight, params.cropSize);
  const maxScale = minScale * 4;
  const scale = Math.min(Math.max(params.scale, minScale), maxScale);

  const displayWidth = params.imageWidth * scale;
  const displayHeight = params.imageHeight * scale;

  const minTranslateX = (params.cropSize - displayWidth) / 2;
  const maxTranslateX = (displayWidth - params.cropSize) / 2;
  const minTranslateY = (params.cropSize - displayHeight) / 2;
  const maxTranslateY = (displayHeight - params.cropSize) / 2;

  return {
    scale,
    translateX: Math.min(Math.max(params.translateX, minTranslateX), maxTranslateX),
    translateY: Math.min(Math.max(params.translateY, minTranslateY), maxTranslateY),
  };
}

export function computeProfilePhotoCropRect(params: {
  imageWidth: number;
  imageHeight: number;
  cropSize: number;
  scale: number;
  translateX: number;
  translateY: number;
}): ProfilePhotoCropRect {
  const clamped = clampProfilePhotoTransform(params);
  const displayWidth = params.imageWidth * clamped.scale;
  const displayHeight = params.imageHeight * clamped.scale;
  const displayLeft = params.cropSize / 2 - displayWidth / 2 + clamped.translateX;
  const displayTop = params.cropSize / 2 - displayHeight / 2 + clamped.translateY;

  const intersectLeft = Math.max(0, displayLeft);
  const intersectTop = Math.max(0, displayTop);
  const intersectRight = Math.min(params.cropSize, displayLeft + displayWidth);
  const intersectBottom = Math.min(params.cropSize, displayTop + displayHeight);

  const originX = Math.max(0, Math.round((intersectLeft - displayLeft) / clamped.scale));
  const originY = Math.max(0, Math.round((intersectTop - displayTop) / clamped.scale));
  const width = Math.max(1, Math.round((intersectRight - intersectLeft) / clamped.scale));
  const height = Math.max(1, Math.round((intersectBottom - intersectTop) / clamped.scale));

  const size = Math.min(width, height, params.imageWidth - originX, params.imageHeight - originY);

  return {
    originX,
    originY,
    width: size,
    height: size,
  };
}

export async function loadImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}
