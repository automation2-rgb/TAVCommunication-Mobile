import { apiFetch } from '@/lib/api-client';
import type { ChatConversation, ChatMessage } from '@/types/chat';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeConversation(value: unknown): ChatConversation | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  const kind = value.kind === 'group' ? 'group' : 'dm';
  const peerRaw = value.peer;
  const peer =
    isRecord(peerRaw) && typeof peerRaw.user_id === 'string'
      ? {
          user_id: peerRaw.user_id,
          display_name: typeof peerRaw.display_name === 'string' ? peerRaw.display_name : null,
          email: typeof peerRaw.email === 'string' ? peerRaw.email : null,
          avatar_storage_path:
            typeof peerRaw.avatar_storage_path === 'string' ? peerRaw.avatar_storage_path : null,
        }
      : null;

  const membersRaw = value.members;
  const members = Array.isArray(membersRaw)
    ? membersRaw
        .map((member) => {
          if (!isRecord(member) || typeof member.user_id !== 'string') {
            return null;
          }
          return {
            user_id: member.user_id,
            display_name: typeof member.display_name === 'string' ? member.display_name : null,
            email: typeof member.email === 'string' ? member.email : null,
            avatar_storage_path:
              typeof member.avatar_storage_path === 'string' ? member.avatar_storage_path : null,
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null)
    : undefined;

  return {
    id: value.id,
    kind,
    title: typeof value.title === 'string' ? value.title : null,
    last_message_at: typeof value.last_message_at === 'string' ? value.last_message_at : null,
    last_message_body: typeof value.last_message_body === 'string' ? value.last_message_body : null,
    unread: Boolean(value.unread),
    peer,
    members,
  };
}

function normalizeConversations(payload: unknown): ChatConversation[] {
  if (Array.isArray(payload)) {
    return payload
      .map(normalizeConversation)
      .filter((conversation): conversation is ChatConversation => conversation !== null);
  }

  if (isRecord(payload)) {
    for (const key of ['conversations', 'items', 'data']) {
      const nested = payload[key];
      if (Array.isArray(nested)) {
        return normalizeConversations(nested);
      }
    }
  }

  return [];
}

function normalizeMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  return {
    id: value.id,
    conversation_id:
      typeof value.conversation_id === 'string'
        ? value.conversation_id
        : typeof value.internal_conversation_id === 'string'
          ? value.internal_conversation_id
          : '',
    sender_user_id: typeof value.sender_user_id === 'string' ? value.sender_user_id : '',
    body: typeof value.body === 'string' ? value.body : null,
    created_at: typeof value.created_at === 'string' ? value.created_at : new Date().toISOString(),
    deleted_at: typeof value.deleted_at === 'string' ? value.deleted_at : null,
    reply_to_message_id:
      typeof value.reply_to_message_id === 'string' ? value.reply_to_message_id : null,
  };
}

function normalizeMessages(payload: unknown): ChatMessage[] {
  if (Array.isArray(payload)) {
    return payload
      .map(normalizeMessage)
      .filter((message): message is ChatMessage => message !== null);
  }

  if (isRecord(payload)) {
    for (const key of ['messages', 'items', 'data']) {
      const nested = payload[key];
      if (Array.isArray(nested)) {
        return normalizeMessages(nested);
      }
    }

    const single = normalizeMessage(payload.message ?? payload);
    return single ? [single] : [];
  }

  return [];
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error?.trim()) {
      return body.error.trim();
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

export async function apiListChatConversations(): Promise<ChatConversation[]> {
  const response = await apiFetch('/api/chat/conversations');
  if (!response.ok) {
    throw new ChatApiError(await parseApiError(response), response.status);
  }
  const body = await response.json();
  return normalizeConversations(body);
}

export async function apiCreateDmConversation(peerUserId: string): Promise<ChatConversation> {
  const response = await apiFetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ peer_user_id: peerUserId }),
  });

  if (!response.ok) {
    throw new ChatApiError(await parseApiError(response), response.status);
  }

  const body = await response.json();
  const conversation = normalizeConversation(isRecord(body) ? (body.conversation ?? body) : body);
  if (!conversation) {
    throw new ChatApiError('Invalid conversation response.');
  }
  return conversation;
}

export async function apiCreateGroupConversation(input: {
  memberUserIds: string[];
  title?: string;
}): Promise<ChatConversation> {
  const payloadVariants = [
    { member_user_ids: input.memberUserIds, title: input.title?.trim() || undefined },
    { member_ids: input.memberUserIds, title: input.title?.trim() || undefined },
    { user_ids: input.memberUserIds, title: input.title?.trim() || undefined },
  ];

  let lastError = 'Unable to create group.';

  for (const body of payloadVariants) {
    const response = await apiFetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const parsed = await response.json();
      const conversation = normalizeConversation(isRecord(parsed) ? (parsed.conversation ?? parsed) : parsed);
      if (conversation) {
        return conversation;
      }
    } else {
      lastError = await parseApiError(response);
    }
  }

  throw new ChatApiError(lastError);
}

export async function apiListChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await apiFetch(`/api/chat/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new ChatApiError(await parseApiError(response), response.status);
  }
  const body = await response.json();
  return normalizeMessages(body);
}

export async function apiMarkChatConversationRead(conversationId: string): Promise<void> {
  const response = await apiFetch(`/api/chat/conversations/${conversationId}/read`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new ChatApiError(await parseApiError(response), response.status);
  }
}

export async function apiSendChatTextMessage(
  conversationId: string,
  body: string,
): Promise<ChatMessage> {
  const response = await apiFetch(`/api/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new ChatApiError(await parseApiError(response), response.status);
  }

  const payload = await response.json();
  const message = normalizeMessage(isRecord(payload) ? (payload.message ?? payload) : payload);
  if (!message) {
    throw new ChatApiError('Invalid message response.');
  }
  return message;
}
