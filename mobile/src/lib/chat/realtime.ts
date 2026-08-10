import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types/chat';

export function subscribeToChatMessages(
  conversationId: string,
  onInsert: (message: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`chat-messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'internal_messages',
        filter: `internal_conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (typeof row.id !== 'string') {
          return;
        }
        onInsert({
          id: row.id,
          conversation_id: conversationId,
          sender_user_id: typeof row.sender_user_id === 'string' ? row.sender_user_id : '',
          body: typeof row.body === 'string' ? row.body : null,
          created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
          deleted_at: typeof row.deleted_at === 'string' ? row.deleted_at : null,
          reply_to_message_id:
            typeof row.reply_to_message_id === 'string' ? row.reply_to_message_id : null,
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToChatConversations(onChange: () => void) {
  const channel = supabase
    .channel('chat-conversations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'internal_conversations' },
      () => onChange(),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'internal_messages' },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
