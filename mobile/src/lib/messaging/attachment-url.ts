import { apiFetch } from '@/lib/api-client';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

export function attachmentApiPath(attachmentId: string) {
  return `/api/messages/attachments/${attachmentId}/url`;
}

export function attachmentApiUrl(attachmentId: string) {
  return `${env.apiBaseUrl}${attachmentApiPath(attachmentId)}`;
}

export async function getAttachmentAuthHeaders(): Promise<Record<string, string>> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) {
    return {};
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getAttachmentImageSource(attachmentId: string) {
  const headers = await getAttachmentAuthHeaders();
  return {
    uri: attachmentApiUrl(attachmentId),
    headers,
  };
}

/** Follow API redirect to the signed media URL (for Linking / non-image types). */
export async function resolveAttachmentMediaUrl(attachmentId: string): Promise<string | null> {
  const response = await apiFetch(attachmentApiPath(attachmentId), {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    return null;
  }

  return response.url || null;
}
