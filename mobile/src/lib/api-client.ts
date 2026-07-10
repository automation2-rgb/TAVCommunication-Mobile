import { fetch } from 'expo/fetch';

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

function buildSendParameters(payload: SendMessagePayload): Record<string, string> {
  const parameters: Record<string, string> = {
    inbox_id: payload.inboxId,
    body: payload.body.trim(),
  };

  if (payload.threadId) {
    parameters.thread_id = payload.threadId;
  }

  if (payload.toE164) {
    parameters.to = payload.toE164;
  }

  return parameters;
}

function buildSendFormData(payload: SendMessagePayload) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(buildSendParameters(payload))) {
    formData.append(key, value);
  }

  return formData;
}

async function postSendFormData(
  formData: FormData,
  accessToken: string | null,
): Promise<Response> {
  return fetch(`${env.apiBaseUrl}/api/messages/send`, {
    method: 'POST',
    body: formData,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

async function getAccessToken() {
  const session = (await supabase.auth.getSession()).data.session;
  return session?.access_token ?? null;
}

async function withAuthRetry(send: (accessToken: string | null) => Promise<Response>): Promise<Response> {
  const accessToken = await getAccessToken();
  let response = await send(accessToken);

  if (response.status !== 401) {
    return response;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (!error && data.session?.access_token) {
    return send(data.session.access_token);
  }

  await supabase.auth.signOut();
  throw new ApiUnauthorizedError();
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { retryOnUnauthorized = true, headers, ...rest } = options;

  const send = async (accessToken: string | null) =>
    fetch(`${env.apiBaseUrl}${path}`, {
      ...rest,
      headers: {
        ...(headers ?? {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  if (!retryOnUnauthorized) {
    const accessToken = await getAccessToken();
    return send(accessToken);
  }

  return withAuthRetry(send);
}

export async function apiSendMessage(payload: SendMessagePayload) {
  const files = payload.files ?? [];

  if (files.length === 0) {
    return withAuthRetry((accessToken) => postSendFormData(buildSendFormData(payload), accessToken));
  }

  const mmsUpload = await import('@/lib/messaging/mms-upload');
  const { prepared, cleanup } = await mmsUpload.prepareUploadFiles(files);

  try {
    const parameters = buildSendParameters(payload);
    const headers: Record<string, string> = {};
    return await withAuthRetry(async (accessToken) => {
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const result = await mmsUpload.postMultipartMessage(
        `${env.apiBaseUrl}/api/messages/send`,
        parameters,
        prepared,
        headers,
      );
      return mmsUpload.mmsUploadResponseToFetchResponse(result);
    });
  } finally {
    cleanup();
  }
}
