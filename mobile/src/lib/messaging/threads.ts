import { supabase } from '@/lib/supabase';
import type { Thread, ThreadListTab } from '@/types/messaging';

const THREAD_COLUMNS =
  'id, inbox_id, thread_kind, customer_e164, display_name, contact_id, last_message_body, last_message_at, last_message_direction, last_message_sent_by, archived_at, archived_by, group_participant_snapshot, created_at';

export async function fetchThreadsForInbox(inboxId: string, tab: Exclude<ThreadListTab, 'unread'>): Promise<Thread[]> {
  let query = supabase.from('threads').select(THREAD_COLUMNS).eq('inbox_id', inboxId);

  if (tab === 'active') {
    query = query.is('archived_at', null);
  } else {
    query = query.not('archived_at', 'is', null);
  }

  const { data, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Thread[];
}

export async function fetchThreadById(threadId: string): Promise<Thread | null> {
  const { data, error } = await supabase.from('threads').select(THREAD_COLUMNS).eq('id', threadId).maybeSingle();

  if (error) {
    throw error;
  }

  return data as Thread | null;
}

export function formatThreadTitle(thread: Thread): string {
  if (thread.display_name?.trim()) {
    return thread.display_name.trim();
  }

  if (thread.customer_e164) {
    return thread.customer_e164;
  }

  return 'Conversation';
}
