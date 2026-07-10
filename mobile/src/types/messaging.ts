export type ThreadKind = 'direct' | 'app_group' | 'group_mms';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'undelivered'
  | 'sending';

export type Inbox = {
  id: string;
  slug: string;
  display_name: string;
  twilio_phone_e164: string | null;
  sort_order: number;
};

export type Thread = {
  id: string;
  inbox_id: string;
  thread_kind: ThreadKind;
  customer_e164: string | null;
  display_name: string | null;
  contact_id: string | null;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_direction: MessageDirection | null;
  last_message_sent_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  group_participant_snapshot: unknown;
  created_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  direction: MessageDirection;
  body: string | null;
  status: MessageStatus | string;
  sent_by: string | null;
  sender_e164: string | null;
  created_at: string;
};

export type MessageAttachment = {
  id: string;
  message_id: string;
  content_type: string | null;
  filename: string | null;
  size_bytes: number | null;
};

export type ThreadRead = {
  user_id: string;
  thread_id: string;
  read_at: string;
};

export type ThreadListTab = 'active' | 'unread' | 'done';

export type ContactDirectoryRow = {
  id: string;
  phone_e164: string;
  display_name: string | null;
  notes: string | null;
  tags: string[] | null;
  source: string | null;
  updated_at: string | null;
};

export type ContactDirectoryKind = 'external' | 'team';
