import { apiSendMessage } from '@/lib/api-client';
import type { Message } from '@/types/messaging';

export type SendDirectMessageInput = {
  inboxId: string;
  threadId?: string;
  toE164?: string;
  body: string;
};

export type SendDirectMessageResult = {
  message: Message | null;
  threadId: string | null;
};

function parseSendResponse(payload: unknown, fallbackThreadId?: string): SendDirectMessageResult {
  if (!payload || typeof payload !== 'object') {
    return { message: null, threadId: fallbackThreadId ?? null };
  }

  const record = payload as Record<string, unknown>;
  const message = (record.message ?? record.data) as Message | undefined;
  const thread = record.thread as { id?: string } | undefined;

  return {
    message: message ?? null,
    threadId: thread?.id ?? (record.threadId as string | undefined) ?? fallbackThreadId ?? null,
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

export async function sendDirectMessage(input: SendDirectMessageInput): Promise<SendDirectMessageResult> {
  const response = await apiSendMessage({
    inboxId: input.inboxId,
    threadId: input.threadId,
    toE164: input.toE164,
    body: input.body,
  });

  if (!response.ok) {
    let message = 'Unable to send message.';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }

  try {
    const payload = (await response.json()) as unknown;
    return parseSendResponse(payload, input.threadId);
  } catch {
    return { message: null, threadId: input.threadId ?? null };
  }
}
