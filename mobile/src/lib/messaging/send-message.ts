import { apiSendMessage, type SendMessageFile } from '@/lib/api-client';
import { fetchMessageById } from '@/lib/messaging/messages';
import type { ComposerFile } from '@/lib/messaging/mms-policy';
import type { Message } from '@/types/messaging';

export type SendDirectMessageInput = {
  inboxId: string;
  threadId?: string;
  toE164?: string;
  body: string;
  files?: ComposerFile[];
  /** Thread to use when the API acks send without returning a message row (e.g. open conversation). */
  fallbackThreadId?: string;
};

export type SendDirectMessageResult = {
  message: Message | null;
  threadId: string;
};

const FAILED_STATUSES = new Set(['failed', 'undelivered']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asMessage(value: unknown): Message | undefined {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return undefined;
  }
  return value as Message;
}

function extractMessageFromPayload(record: Record<string, unknown>): Message | undefined {
  for (const key of ['message', 'createdMessage', 'outboundMessage', 'result']) {
    const candidate = asMessage(record[key]);
    if (candidate) {
      return candidate;
    }
  }

  const data = record.data;
  if (isRecord(data)) {
    for (const key of ['message', 'createdMessage', 'outboundMessage', 'result']) {
      const candidate = asMessage(data[key]);
      if (candidate) {
        return candidate;
      }
    }

    const nestedMessages = data.messages as unknown;
    if (Array.isArray(nestedMessages)) {
      const first = asMessage(nestedMessages[0]);
      if (first) {
        return first;
      }
    }

    const directDataMessage = asMessage(data);
    if (directDataMessage) {
      return directDataMessage;
    }
  }

  const topLevelMessages = record.messages as unknown;
  if (Array.isArray(topLevelMessages)) {
    const first = asMessage(topLevelMessages[0]);
    if (first) {
      return first;
    }
  }

  return asMessage(record);
}

function extractThreadId(
  record: Record<string, unknown>,
  message?: Message,
  fallbackThreadId?: string,
): string | null {
  const thread = record.thread;
  if (isRecord(thread) && typeof thread.id === 'string') {
    return thread.id;
  }

  if (typeof record.threadId === 'string') {
    return record.threadId;
  }

  if (typeof record.thread_id === 'string') {
    return record.thread_id;
  }

  const data = record.data;
  if (isRecord(data)) {
    if (typeof data.threadId === 'string') {
      return data.threadId;
    }
    if (typeof data.thread_id === 'string') {
      return data.thread_id;
    }
    const nestedThread = data.thread;
    if (isRecord(nestedThread) && typeof nestedThread.id === 'string') {
      return nestedThread.id;
    }
  }

  if (message?.thread_id) {
    return message.thread_id;
  }

  return fallbackThreadId ?? null;
}

async function resolveThreadId(
  message: Message | undefined,
  threadId: string | null,
): Promise<{ message: Message | undefined; threadId: string | null }> {
  if (threadId || !message?.id) {
    return { message, threadId };
  }

  const saved = await fetchMessageById(message.id);
  if (!saved?.thread_id) {
    return { message, threadId };
  }

  return {
    message: { ...saved, ...message, thread_id: saved.thread_id },
    threadId: saved.thread_id,
  };
}

async function parseSendResponse(
  payload: unknown,
  fallbackThreadId?: string,
): Promise<SendDirectMessageResult> {
  if (!isRecord(payload)) {
    throw new Error('Server returned an invalid send response.');
  }

  let message = extractMessageFromPayload(payload);
  let threadId = extractThreadId(payload, message, fallbackThreadId);
  ({ message, threadId } = await resolveThreadId(message, threadId));

  if (!message?.id) {
    if (payload.error) {
      throw new Error(String(payload.error));
    }

    const implicitSuccess =
      payload.ok === true || payload.success === true || Boolean(threadId);

    if (implicitSuccess) {
      if (!threadId) {
        throw new Error('Server did not return a thread for this message.');
      }
      return { message: null, threadId };
    }

    throw new Error('Server did not confirm the message was created.');
  }

  if (!threadId) {
    throw new Error('Server did not return a thread for this message.');
  }

  const status = String(message.status ?? '').toLowerCase();
  if (FAILED_STATUSES.has(status)) {
    const hint = payload.error ?? payload.error_hint;
    throw new Error(
      typeof hint === 'string' && hint.length > 0
        ? hint
        : 'The message could not be delivered.',
    );
  }

  return {
    message,
    threadId,
  };
}

export function createOptimisticMessage(params: {
  threadId: string;
  body: string;
  sentBy: string;
}): Message {
  return {
    id: `optimistic-${Date.now()}`,
    thread_id: params.threadId,
    direction: 'outbound',
    body: params.body,
    status: 'sending',
    sent_by: params.sentBy,
    sender_e164: null,
    created_at: new Date().toISOString(),
  };
}

export function createPendingAttachmentPreviews(
  messageId: string,
  files: ComposerFile[],
) {
  return files.map((file, index) => ({
    id: `pending-${messageId}-${index}`,
    uri: file.uri,
    content_type: file.type,
    filename: file.name,
  }));
}

export type PendingAttachmentPreview = ReturnType<typeof createPendingAttachmentPreviews>[number];

export async function sendDirectMessage(input: SendDirectMessageInput): Promise<SendDirectMessageResult> {
  const hasAttachments = (input.files?.length ?? 0) > 0;
  const files: SendMessageFile[] | undefined = input.files?.map((file) => ({
    uri: file.uri,
    name: file.name,
    type: file.type,
  }));

  const response = await apiSendMessage({
    inboxId: input.inboxId,
    threadId: input.threadId,
    toE164: input.toE164,
    body: input.body.trim(),
    files,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      hasAttachments
        ? 'Unable to send attachment. The server response was invalid.'
        : 'Unable to send message. The server response was invalid.',
    );
  }

  if (!response.ok) {
    const body = payload as { error?: string; message?: string };
    const apiMessage = body.error ?? body.message;
    throw new Error(typeof apiMessage === 'string' ? apiMessage : 'Unable to send message.');
  }

  return parseSendResponse(payload, input.fallbackThreadId ?? input.threadId);
}
