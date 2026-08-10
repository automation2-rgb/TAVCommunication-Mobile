import { File, Paths } from 'expo-file-system';
import { Image } from 'react-native';

import { normalizeMimeType } from '@/lib/messaging/mms-policy';

const MAX_EDGE_PX = 512;
const TARGET_MAX_BYTES = 200 * 1024;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.08;
const MAX_ATTEMPTS = 8;

const COMPRESSIBLE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSIBLE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

type ImageManipulatorModule = typeof import('expo-image-manipulator');

export type CompressProfileImageResult = {
  uri: string;
  cleanup: () => void;
};

function isCompressibleImage(name: string, mimeType: string) {
  const normalized = normalizeMimeType(mimeType);
  if (COMPRESSIBLE_MIME_TYPES.has(normalized)) {
    return true;
  }
  return COMPRESSIBLE_EXTENSIONS.test(name);
}

function readFileSize(uri: string): number | null {
  try {
    const source = new File(uri);
    if (source.exists && source.size > 0) {
      return source.size;
    }
  } catch {
    // Ignore unreadable staging URIs.
  }
  return null;
}

async function loadImageManipulator(): Promise<ImageManipulatorModule | null> {
  try {
    return await import('expo-image-manipulator');
  } catch {
    return null;
  }
}

function squareCropActions(width: number, height: number) {
  const size = Math.min(width, height);
  const originX = Math.floor((width - size) / 2);
  const originY = Math.floor((height - size) / 2);
  return [{ crop: { originX, originY, width: size, height: size } }];
}

function resizeActions(width: number, height: number) {
  if (Math.max(width, height) <= MAX_EDGE_PX) {
    return [];
  }
  if (width >= height) {
    return [{ resize: { width: MAX_EDGE_PX } }];
  }
  return [{ resize: { height: MAX_EDGE_PX } }];
}

export async function compressProfileImage(params: {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  crop?: { originX: number; originY: number; width: number; height: number };
}): Promise<CompressProfileImageResult> {
  const noop = (): CompressProfileImageResult => ({
    uri: params.uri,
    cleanup: () => {},
  });

  if (!isCompressibleImage(params.name, params.mimeType)) {
    throw new Error('Profile photos must be JPEG, PNG, or WebP.');
  }

  const ImageManipulator = await loadImageManipulator();
  if (!ImageManipulator) {
    return noop();
  }

  let dimensions: { width: number; height: number };
  try {
    dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        params.uri,
        (width: number, height: number) => resolve({ width, height }),
        (error: Error) => reject(error),
      );
    });
  } catch {
    return noop();
  }

  const cropWidth = params.crop?.width ?? dimensions.width;
  const cropHeight = params.crop?.height ?? dimensions.height;
  const actions = params.crop
    ? [{ crop: params.crop }, ...resizeActions(cropWidth, cropHeight)]
    : [...squareCropActions(dimensions.width, dimensions.height), ...resizeActions(dimensions.width, dimensions.height)];
  let quality = 0.86;
  let bestUri: string | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await ImageManipulator.manipulateAsync(params.uri, actions, {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const size = readFileSize(result.uri);
      bestUri = result.uri;

      if (!size || size <= TARGET_MAX_BYTES || quality <= MIN_QUALITY) {
        break;
      }

      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } catch {
      break;
    }
  }

  if (!bestUri) {
    return noop();
  }

  const cached = new File(Paths.cache, `profile-avatar-${Date.now()}.jpg`);
  const source = new File(bestUri);
  const copyResult = source.copy(cached, { overwrite: true }) as void | Promise<void>;
  if (copyResult instanceof Promise) {
    await copyResult;
  }

  if (!cached.exists || cached.size <= 0) {
    return {
      uri: bestUri,
      cleanup: () => {},
    };
  }

  return {
    uri: cached.uri,
    cleanup: () => {
      try {
        cached.delete();
      } catch {
        // Best-effort cache cleanup.
      }
    },
  };
}
