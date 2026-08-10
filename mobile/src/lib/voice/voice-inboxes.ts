import type { Inbox } from '@/types/messaging';

import { isVoiceEnabledInbox } from '@/lib/voice/voice-enabled';

export function getVoiceEnabledInboxes(inboxes: Inbox[]): Inbox[] {
  return inboxes.filter(isVoiceEnabledInbox);
}
