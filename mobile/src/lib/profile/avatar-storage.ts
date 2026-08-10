import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { compressProfileImage } from '@/lib/profile/compress-profile-image';

export const PROFILE_AVATAR_BUCKET = 'profile-avatars';

const SIGNED_URL_TTL_SEC = 3600;
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

type CachedSignedUrl = {
  url: string;
  expiresAt: number;
};

const signedUrlCache = new Map<string, CachedSignedUrl>();

export function profileAvatarObjectPath(userId: string): string {
  return `${userId}/avatar.jpg`;
}

export function invalidateProfileAvatarUrl(storagePath: string | null | undefined) {
  if (storagePath) {
    signedUrlCache.delete(storagePath);
  }
}

export async function getProfileAvatarSignedUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) {
    return null;
  }

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL_SEC * 1000,
  });

  return data.signedUrl;
}

async function readUploadBytes(uri: string): Promise<ArrayBuffer> {
  const source = new File(uri);

  if (!source.exists || source.size <= 0) {
    throw new Error('Unable to read the selected photo.');
  }

  return source.arrayBuffer();
}

export async function uploadProfileAvatar(params: {
  userId: string;
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  alreadyPrepared?: boolean;
}): Promise<string> {
  const compressed = params.alreadyPrepared
    ? { uri: params.uri, cleanup: () => {} }
    : await compressProfileImage({
        uri: params.uri,
        name: params.name,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
      });

  try {
    const path = profileAvatarObjectPath(params.userId);
    const bytes = await readUploadBytes(compressed.uri);

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_storage_path: path })
      .eq('id', params.userId);

    if (profileError) {
      throw profileError;
    }

    invalidateProfileAvatarUrl(path);
    return path;
  } finally {
    compressed.cleanup();
  }
}

export async function removeProfileAvatar(
  userId: string,
  storagePath: string | null | undefined,
): Promise<void> {
  if (storagePath) {
    const { error: removeError } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove([storagePath]);

    if (removeError) {
      throw removeError;
    }

    invalidateProfileAvatarUrl(storagePath);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_storage_path: null })
    .eq('id', userId);

  if (profileError) {
    throw profileError;
  }
}
