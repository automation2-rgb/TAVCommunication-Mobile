import type { Inbox } from '@/types/messaging';
import type { Thread } from '@/types/messaging';

export function isVoiceEnabledInbox(inbox: Pick<Inbox, 'twilio_phone_e164'> | null | undefined): boolean {
  return Boolean(inbox?.twilio_phone_e164?.trim());
}

export function canPlaceThreadVoiceCall(
  thread: Pick<Thread, 'thread_kind' | 'customer_e164'> | null | undefined,
  inbox: Pick<Inbox, 'twilio_phone_e164'> | null | undefined,
): boolean {
  if (!thread || !isVoiceEnabledInbox(inbox)) {
    return false;
  }

  return thread.thread_kind === 'direct' && Boolean(thread.customer_e164?.trim());
}
