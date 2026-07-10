import { supabase } from '@/lib/supabase';
import type { MessageAttachment } from '@/types/messaging';

const ATTACHMENT_COLUMNS = 'id, message_id, content_type, filename, size_bytes';

export async function fetchAttachmentsForMessages(messageIds: string[]): Promise<MessageAttachment[]> {
  if (messageIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('message_attachments')
    .select(ATTACHMENT_COLUMNS)
    .in('message_id', messageIds)
    .order('id', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageAttachment[];
}

export function groupAttachmentsByMessageId(attachments: MessageAttachment[]) {
  const map = new Map<string, MessageAttachment[]>();

  for (const attachment of attachments) {
    const current = map.get(attachment.message_id) ?? [];
    current.push(attachment);
    map.set(attachment.message_id, current);
  }

  return map;
}
