import { File, Paths } from 'expo-file-system';
import { Image } from 'react-native';

import { normalizeMimeType } from '@/lib/messaging/mms-policy';

const MAX_EDGE_PX = 1600;
const TARGET_MAX_BYTES = 600 * 1024;
const SKIP_BELOW_BYTES = 450 * 1024;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.08;
const MAX_ATTEMPTS = 8;

const COMPRESSIBLE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COMPRESSIBLE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

type ImageManipulatorModule = typeof import('expo-image-manipulator');

export type CompressImageResult = {
  uri: string;
  name: string;
  mimeType: string;
  cleanup: () => void;
};

function isCompressibleImage(name: string, mimeType: string) {
  const normalized = normalizeMimeType(mimeType);
  if (COMPRESSIBLE_MIME_TYPES.has(normalized)) {
    return true;
  }
  return COMPRESSIBLE_EXTENSIONS.test(name);
}

function jpegFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, '').trim() || 'attachment';
  return `${base}.jpg`;
}

function uniqueCacheName(filename: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `mms-compress-${Date.now()}-${suffix}-${filename}`;
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

async function resizeLongestEdge(uri: string, width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE_PX) {
    return [];
  }

  if (width >= height) {
    return [{ resize: { width: MAX_EDGE_PX } }];
  }

  return [{ resize: { height: MAX_EDGE_PX } }];
}

export async function compressOutboundImage(params: {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
}): Promise<CompressImageResult> {
  const noop = (): CompressImageResult => ({
    uri: params.uri,
    name: params.name,
    mimeType: params.mimeType,
    cleanup: () => {},
  });

  if (!isCompressibleImage(params.name, params.mimeType)) {
    return noop();
  }

  const ImageManipulator = await loadImageManipulator();
  if (!ImageManipulator) {
    return noop();
  }

  const initialSize = params.sizeBytes ?? readFileSize(params.uri);
  if (typeof initialSize === 'number' && initialSize <= SKIP_BELOW_BYTES) {
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

  const resizeActions = await resizeLongestEdge(params.uri, dimensions.width, dimensions.height);
  const outputName = jpegFilename(params.name);
  let quality = 0.88;
  let bestUri: string | null = null;
  let bestSize: number | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await ImageManipulator.manipulateAsync(params.uri, resizeActions, {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const size = readFileSize(result.uri);
      if (!size) {
        break;
      }

      bestUri = result.uri;
      bestSize = size;

      if (size <= TARGET_MAX_BYTES) {
        break;
      }

      if (quality <= MIN_QUALITY) {
        break;
      }

      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    } catch {
      break;
    }
  }

  if (!bestUri || bestSize === null) {
    return noop();
  }

  if (typeof initialSize === 'number' && bestSize >= initialSize) {
    return noop();
  }

  const cached = new File(Paths.cache, uniqueCacheName(outputName));
  const source = new File(bestUri);
  const copyResult = source.copy(cached, { overwrite: true }) as void | Promise<void>;
  if (copyResult instanceof Promise) {
    await copyResult;
  }

  if (!cached.exists || cached.size <= 0) {
    return {
      uri: bestUri,
      name: outputName,
      mimeType: 'image/jpeg',
      cleanup: () => {},
    };
  }

  return {
    uri: cached.uri,
    name: outputName,
    mimeType: 'image/jpeg',
    cleanup: () => {
      try {
        cached.delete();
      } catch {
        // Best-effort cache cleanup.
      }
    },
  };
}
