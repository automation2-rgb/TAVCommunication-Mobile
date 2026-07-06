import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Message, Thread } from '@/types/messaging';

const THREAD_REALTIME_COLUMNS =
  'id, inbox_id, thread_kind, customer_e164, display_name, contact_id, last_message_body, last_message_at, last_message_direction, last_message_sent_by, archived_at, archived_by, group_participant_snapshot, created_at';

const MESSAGE_REALTIME_COLUMNS =
  'id, thread_id, direction, body, status, sent_by, sender_e164, created_at';

export type ThreadRealtimeHandlers = {
  onInsert?: (thread: Thread) => void;
  onUpdate?: (thread: Thread) => void;
  onDelete?: (threadId: string) => void;
};

export type MessageRealtimeHandlers = {
  onInsert?: (message: Message) => void;
  onUpdate?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
};

function parseThreadRecord(record: Record<string, unknown> | null): Thread | null {
  if (!record?.id) {
    return null;
  }
  return record as Thread;
}

function parseMessageRecord(record: Record<string, unknown> | null): Message | null {
  if (!record?.id) {
    return null;
  }
  return record as Message;
}

export function mergeThreadList(existing: Thread[], next: Thread): Thread[] {
  const index = existing.findIndex((thread) => thread.id === next.id);
  const copy = index === -1 ? [...existing, next] : existing.map((thread, i) => (i === index ? next : thread));

  return copy.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function removeThreadFromList(existing: Thread[], threadId: string): Thread[] {
  return existing.filter((thread) => thread.id !== threadId);
}

export function subscribeToInboxThreads(
  inboxId: string,
  handlers: ThreadRealtimeHandlers,
): RealtimeChannel {
  return supabase
    .channel(`realtime:threads:${inboxId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'threads',
        filter: `inbox_id=eq.${inboxId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.eventType === 'DELETE') {
          const threadId = String(payload.old.id ?? '');
          if (threadId) {
            handlers.onDelete?.(threadId);
          }
          return;
        }

        const thread = parseThreadRecord(payload.new);
        if (!thread) {
          return;
        }

        if (payload.eventType === 'INSERT') {
          handlers.onInsert?.(thread);
          return;
        }

        handlers.onUpdate?.(thread);
      },
    )
    .subscribe();
}

export function subscribeToThreadMessages(
  threadId: string,
  handlers: MessageRealtimeHandlers,
): RealtimeChannel {
  return supabase
    .channel(`realtime:messages:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        if (payload.eventType === 'DELETE') {
          const messageId = String(payload.old.id ?? '');
          if (messageId) {
            handlers.onDelete?.(messageId);
          }
          return;
        }

        const message = parseMessageRecord(payload.new);
        if (!message) {
          return;
        }

        if (payload.eventType === 'INSERT') {
          handlers.onInsert?.(message);
          return;
        }

        handlers.onUpdate?.(message);
      },
    )
    .subscribe();
}

export async function unsubscribeChannel(channel: RealtimeChannel) {
  await supabase.removeChannel(channel);
}

export { THREAD_REALTIME_COLUMNS, MESSAGE_REALTIME_COLUMNS };
