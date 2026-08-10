import { supabase } from '@/lib/supabase';
import type { Inbox } from '@/types/messaging';
import { isValidE164Phone } from '@/lib/phone/e164';

export async function resolveDirectThreadForPhone(inboxId: string, phoneE164: string): Promise<string> {
  const normalized = phoneE164.trim();
  if (!isValidE164Phone(normalized)) {
    throw new Error('Invalid phone number.');
  }

  const { data: existing, error: lookupError } = await supabase
    .from('threads')
    .select('id')
    .eq('inbox_id', inboxId)
    .eq('thread_kind', 'direct')
    .eq('customer_e164', normalized)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const rpcAttempts = [
    { p_inbox_id: inboxId, p_customer_e164: normalized },
    { inbox_id: inboxId, customer_e164: normalized },
  ];

  for (const args of rpcAttempts) {
    const { data, error } = await supabase.rpc('upsert_direct_thread', args);
    if (!error && data) {
      if (typeof data === 'string') {
        return data;
      }
      if (typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string') {
        return data.id;
      }
    }
  }

  throw new Error('Unable to start a conversation for this number. Send a text first, then try calling.');
}

export function pickVoiceEnabledInbox(inboxes: Inbox[]): Inbox | null {
  return inboxes.find((inbox) => Boolean(inbox.twilio_phone_e164)) ?? null;
}
