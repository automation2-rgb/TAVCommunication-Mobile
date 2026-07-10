import { supabase } from '@/lib/supabase';
import type { Message } from '@/types/messaging';

export const MESSAGE_PAGE_SIZE = 75;

const MESSAGE_COLUMNS = 'id, thread_id, direction, body, status, sent_by, sender_e164, created_at';

export type FetchMessagesPageOptions = {
  limit?: number;
  beforeCreatedAt?: string;
};

export type MessagesPage = {
  messages: Message[];
  hasMore: boolean;
};

export async function fetchMessageById(messageId: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('id', messageId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Message | null) ?? null;
}

export async function fetchMessagesPage(
  threadId: string,
  options: FetchMessagesPageOptions = {},
): Promise<MessagesPage> {
  const limit = options.limit ?? MESSAGE_PAGE_SIZE;

  let query = supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (options.beforeCreatedAt) {
    query = query.lt('created_at', options.beforeCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Message[];
  const hasMore = rows.length > limit;
  const messages = hasMore ? rows.slice(0, limit) : rows;

  return { messages, hasMore };
}

export function mergeMessagesById(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();

  for (const message of existing) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function upsertMessage(existing: Message[], next: Message): Message[] {
  const index = existing.findIndex((message) => message.id === next.id);
  if (index === -1) {
    return mergeMessagesById(existing, [next]);
  }

  const copy = [...existing];
  copy[index] = next;
  return copy;
}

export function removeMessage(existing: Message[], messageId: string): Message[] {
  return existing.filter((message) => message.id !== messageId);
}
