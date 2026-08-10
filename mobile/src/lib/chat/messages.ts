import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { ComposerFile } from '@/lib/messaging/mms-policy';
import { apiFetch } from '@/lib/api-client';
import { apiSendChatTextMessage, ChatApiError } from '@/lib/chat/chat-api';
import type { ChatMessage, ChatMessageAttachment } from '@/types/chat';

export const CHAT_BODY_MAX = 8000;
export const CHAT_MAX_ATTACHMENTS = 5;
export const CHAT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const IMAGE_MIME_PREFIX = 'image/';

export function isChatImageMimeType(mimeType: string | null | undefined) {
  return Boolean(mimeType?.toLowerCase().startsWith(IMAGE_MIME_PREFIX));
}

export function validateChatComposerFiles(files: ComposerFile[]): string | null {
  if (files.length > CHAT_MAX_ATTACHMENTS) {
    return `You can attach up to ${CHAT_MAX_ATTACHMENTS} files.`;
  }

  for (const file of files) {
    if (!isChatImageMimeType(file.type)) {
      return 'Only image attachments are supported in chat.';
    }
    if (file.size != null && file.size > CHAT_MAX_UPLOAD_BYTES) {
      return 'Each image must be 25 MB or smaller.';
    }
  }

  return null;
}

export function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map(existing.map((message) => [message.id, message]));
  for (const message of incoming) {
    map.set(message.id, message);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function upsertChatMessage(existing: ChatMessage[], next: ChatMessage): ChatMessage[] {
  const index = existing.findIndex((message) => message.id === next.id);
  if (index === -1) {
    return mergeChatMessages(existing, [next]);
  }
  const copy = [...existing];
  copy[index] = next;
  return copy;
}

export async function sendChatMessage(input: {
  conversationId: string;
  body: string;
  files?: ComposerFile[];
}): Promise<ChatMessage> {
  const trimmedBody = input.body.trim();
  const files = input.files ?? [];

  if (!trimmedBody && files.length === 0) {
    throw new ChatApiError('Message cannot be empty.');
  }

  const validationError = validateChatComposerFiles(files);
  if (validationError) {
    throw new ChatApiError(validationError);
  }

  if (files.length === 0) {
    return apiSendChatTextMessage(input.conversationId, trimmedBody);
  }

  return sendChatMessageMultipart(input.conversationId, trimmedBody, files);
}

async function sendChatMessageMultipart(
  conversationId: string,
  body: string,
  files: ComposerFile[],
): Promise<ChatMessage> {
  const mmsUpload = await import('@/lib/messaging/mms-upload');
  const { prepared, cleanup } = await mmsUpload.prepareUploadFiles(files);

  try {
    const formData = new FormData();
    if (body) {
      formData.append('body', body);
    }
    for (const file of prepared) {
      formData.append('attachment', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
    }

    const session = (await supabase.auth.getSession()).data.session;
    const response = await fetch(`${env.apiBaseUrl}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error?.trim()) {
          message = payload.error.trim();
        }
      } catch {
        // ignore
      }
      throw new ChatApiError(message, response.status);
    }

    const payload = await response.json();
    const record = payload as Record<string, unknown>;
    const message = (record.message ?? record) as ChatMessage;
    if (!message?.id) {
      throw new ChatApiError('Invalid message response.');
    }
    return message;
  } finally {
    cleanup();
  }
}

export async function fetchChatAttachmentsForMessages(
  messageIds: string[],
): Promise<Record<string, ChatMessageAttachment[]>> {
  if (messageIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('internal_message_attachments')
    .select('id, message_id, content_type, filename, size_bytes, sort_order')
    .in('message_id', messageIds)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  const grouped: Record<string, ChatMessageAttachment[]> = {};
  for (const row of data ?? []) {
    const list = grouped[row.message_id] ?? [];
    list.push(row as ChatMessageAttachment);
    grouped[row.message_id] = list;
  }
  return grouped;
}

export function buildChatAttachmentUrl(attachmentId: string) {
  return `${env.apiBaseUrl}/api/chat/attachments/${attachmentId}/url`;
}

export async function fetchChatAttachmentHeaders(attachmentId: string) {
  const session = (await supabase.auth.getSession()).data.session;
  return {
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
  };
}

export function formatChatConversationTitle(
  conversation: {
    kind: string;
    title: string | null;
    peer?: { display_name?: string | null; email?: string | null } | null;
  },
  currentUserId?: string,
  members?: Array<{ user_id: string; display_name?: string | null; email?: string | null }>,
) {
  if (conversation.kind === 'group') {
    if (conversation.title?.trim()) {
      return conversation.title.trim();
    }
    const names =
      members
        ?.filter((member) => member.user_id !== currentUserId)
        .map((member) => member.display_name?.trim() || member.email?.trim())
        .filter(Boolean) ?? [];
    return names.length > 0 ? names.slice(0, 3).join(', ') : 'Group chat';
  }

  return (
    conversation.peer?.display_name?.trim() ||
    conversation.peer?.email?.trim() ||
    'Direct message'
  );
}

export async function findOrCreateDmConversation(peerUserId: string) {
  const { apiCreateDmConversation, apiListChatConversations } = await import('@/lib/chat/chat-api');
  const existing = (await apiListChatConversations()).find(
    (conversation) =>
      conversation.kind === 'dm' && conversation.peer?.user_id === peerUserId,
  );
  if (existing) {
    return existing;
  }
  return apiCreateDmConversation(peerUserId);
}
