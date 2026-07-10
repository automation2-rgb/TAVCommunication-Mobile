export const MMS_MAX_FILES = 10;
export const MMS_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
]);

const ALLOWED_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp|mp4|mov|mpe?g|m4a)$/i;

export type ComposerFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

export function normalizeMimeType(mimeType: string | null | undefined) {
  const trimmed = (mimeType ?? '').trim().toLowerCase();
  if (!trimmed) {
    return '';
  }
  return trimmed.split(';')[0]?.trim() ?? '';
}

export function isAllowedMmsMimeType(mimeType: string, filename = '') {
  const normalized = normalizeMimeType(mimeType);
  if (normalized && ALLOWED_MIME_TYPES.has(normalized)) {
    return true;
  }
  return ALLOWED_EXTENSION_PATTERN.test(filename.trim());
}

export function isImageMimeType(mimeType: string | null | undefined) {
  return normalizeMimeType(mimeType).startsWith('image/');
}

export function isVideoMimeType(mimeType: string | null | undefined) {
  return normalizeMimeType(mimeType).startsWith('video/');
}

export function isAudioMimeType(mimeType: string | null | undefined) {
  return normalizeMimeType(mimeType).startsWith('audio/');
}

export function formatByteSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateComposerFiles(
  existing: ComposerFile[],
  incoming: ComposerFile[],
): { accepted: ComposerFile[]; error: string | null } {
  if (existing.length + incoming.length > MMS_MAX_FILES) {
    return {
      accepted: [],
      error: `You can attach up to ${MMS_MAX_FILES} files per message.`,
    };
  }

  const accepted: ComposerFile[] = [];

  for (const file of incoming) {
    if (!isAllowedMmsMimeType(file.type, file.name)) {
      return {
        accepted: [],
        error:
          'Only images and short audio/video files are supported (JPEG, PNG, GIF, WebP, MP4, MOV, MP3, M4A).',
      };
    }

    if (typeof file.size === 'number' && file.size > MMS_MAX_BYTES) {
      return {
        accepted: [],
        error: `Each file must be ${formatByteSize(MMS_MAX_BYTES)} or smaller.`,
      };
    }

    accepted.push(file);
  }

  return { accepted, error: null };
}

export function defaultFilename(uri: string, mimeType: string, index: number) {
  const normalized = normalizeMimeType(mimeType);
  const extensionByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
  };
  const extension = extensionByMime[normalized] ?? 'jpg';

  const tail = uri.split('/').pop()?.split('?')[0];
  if (tail && tail.includes('.')) {
    return tail;
  }

  return `attachment-${index + 1}.${extension}`;
}
