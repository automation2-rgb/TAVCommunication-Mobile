import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

type ApiFetchOptions = RequestInit & {
  retryOnUnauthorized?: boolean;
};

export class ApiUnauthorizedError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'ApiUnauthorizedError';
  }
}

export type SendMessagePayload = {
  inboxId: string;
  threadId?: string;
  toE164?: string;
  body: string;
  files?: SendMessageFile[];
};

export type SendMessageFile = {
  uri: string;
  name: string;
  type: string;
};

async function getAccessToken() {
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { retryOnUnauthorized = true, headers, ...rest } = options;
  const accessToken = await getAccessToken();

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      ...(headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) {
      return apiFetch(path, { ...options, retryOnUnauthorized: false });
    }

    await supabase.auth.signOut();
    throw new ApiUnauthorizedError();
  }

  return response;
}

export async function apiSendMessage(payload: SendMessagePayload) {
  const formData = new FormData();
  formData.append('inbox_id', payload.inboxId);

  if (payload.threadId) {
    formData.append('thread_id', payload.threadId);
  }

  if (payload.toE164) {
    formData.append('to', payload.toE164);
  }

  formData.append('body', payload.body);

  for (const file of payload.files ?? []) {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

  return apiFetch('/api/messages/send', {
    method: 'POST',
    body: formData,
  });
}
