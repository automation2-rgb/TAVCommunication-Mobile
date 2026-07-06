import { supabase } from '@/lib/supabase';
import type { Inbox } from '@/types/messaging';

type InboxMemberRow = {
  inbox: Inbox | Inbox[] | null;
};

export async function fetchUserInboxes(userId: string): Promise<Inbox[]> {
  const { data, error } = await supabase
    .from('inbox_members')
    .select('inbox:inboxes(id, slug, display_name, twilio_phone_e164, sort_order)')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as InboxMemberRow[];
  return rows
    .map((row) => (Array.isArray(row.inbox) ? row.inbox[0] : row.inbox))
    .filter((inbox): inbox is Inbox => inbox != null)
    .sort((a, b) => a.sort_order - b.sort_order);
}
