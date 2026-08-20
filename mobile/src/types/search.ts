import type { MessageDirection, ThreadKind } from '@/types/messaging';

export type SearchSelectPayload = {
  inboxId: string;
  threadId: string;
  messageId?: string;
};

export type SearchThreadHit = {
  id: string;
  inbox_id: string;
  customer_e164: string | null;
  thread_kind: ThreadKind | string;
  display_name: string | null;
  contact_id: string | null;
  contacts?: { display_name: string | null } | null;
  last_message_at: string | null;
  thread_participants?: Array<{ participant_e164: string }>;
};

export type SearchMatchedMessage = {
  id: string;
  body: string | null;
  created_at: string;
  direction: MessageDirection;
  sent_by: string | null;
  sender_profile?: { id: string; display_name: string | null } | null;
};

export type SearchResultRow = {
  kind: 'thread';
  thread: SearchThreadHit;
  matchedMessages: SearchMatchedMessage[];
  subtitle: string | null;
  inbox_display_name: string | null;
};

export type SearchRecentThread = {
  id: string;
  display_name: string | null;
  customer_e164: string | null;
  last_message_body: string | null;
  last_message_direction: MessageDirection | null;
  last_message_at: string | null;
};

export type SearchPressableRow =
  | {
      key: string;
      kind: 'recent';
      inboxId: string;
      thread: SearchRecentThread;
    }
  | {
      key: string;
      kind: 'thread';
      inboxId: string;
      threadId: string;
      thread: SearchThreadHit;
      subtitle: string | null;
      inboxDisplayName: string | null;
    }
  | {
      key: string;
      kind: 'message';
      inboxId: string;
      threadId: string;
      messageId: string;
      thread: SearchThreadHit;
      message: SearchMatchedMessage;
      inboxDisplayName: string | null;
    };
