export type ChatConversationKind = 'dm' | 'group';

export type ChatMemberProfile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_storage_path?: string | null;
};

export type ChatConversation = {
  id: string;
  kind: ChatConversationKind;
  title: string | null;
  last_message_at: string | null;
  last_message_body: string | null;
  unread: boolean;
  peer?: ChatMemberProfile | null;
  members?: ChatMemberProfile[];
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string | null;
  created_at: string;
  deleted_at?: string | null;
  reply_to_message_id?: string | null;
};

export type ChatMessageAttachment = {
  id: string;
  message_id: string;
  content_type: string | null;
  filename: string | null;
  size_bytes: number | null;
  sort_order?: number | null;
};
