import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Composer } from '@/components/inbox/composer';
import { ConversationHeader } from '@/components/inbox/conversation-header';
import { EditDisplayNameModal } from '@/components/inbox/edit-display-name-modal';
import { MessageList } from '@/components/inbox/message-list';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useThreadMessages } from '@/hooks/use-thread-messages';
import { useAuth } from '@/lib/auth/auth-provider';
import { createOptimisticMessage, sendDirectMessage } from '@/lib/messaging/send-message';
import { fetchThreadById, formatThreadTitle } from '@/lib/messaging/threads';
import { markThreadDone, reopenThread } from '@/lib/messaging/thread-archive';
import { markThreadUnread, upsertThreadRead, fetchThreadReads } from '@/lib/messaging/thread-reads';
import { updateThreadDisplayName } from '@/lib/messaging/update-thread';
import { upsertMessage } from '@/lib/messaging/messages';
import { isThreadUnread } from '@/lib/messaging/unread';
import { tavColors } from '@/lib/theme';
import type { Message, Thread } from '@/types/messaging';

export default function ConversationScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const { activeInbox } = useInboxWorkspace();

  const [thread, setThread] = useState<Thread | null>(null);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);

  const {
    messages,
    hasMore,
    isLoading,
    isLoadingMore,
    loadOlder,
  } = useThreadMessages({
    threadId,
    userId,
    readAt,
    autoMarkRead: true,
  });

  useEffect(() => {
    if (!threadId) {
      return;
    }

    void fetchThreadById(threadId).then(setThread);
  }, [threadId]);

  useEffect(() => {
    if (!threadId || !userId) {
      return;
    }

    void fetchThreadReads(userId, [threadId]).then((reads) => {
      setReadAt(reads[0]?.read_at ?? null);
    });
  }, [threadId, userId]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const mergedMessages = useMemo(() => localMessages, [localMessages]);

  const canSend = Boolean(activeInbox?.twilio_phone_e164);
  const isDone = Boolean(thread?.archived_at);

  const handleSend = useCallback(
    async (body: string) => {
      if (!userId || !activeInbox?.id || !threadId) {
        return;
      }

      const optimistic = createOptimisticMessage({
        threadId,
        body,
        sentBy: userId,
      });

      setLocalMessages((current) => upsertMessage(current, optimistic));
      setIsSending(true);

      try {
        const result = await sendDirectMessage({
          inboxId: activeInbox.id,
          threadId,
          body,
        });

        if (result.message) {
          setLocalMessages((current) =>
            current.map((message) => (message.id === optimistic.id ? result.message! : message)),
          );
        } else {
          setLocalMessages((current) =>
            current.map((message) =>
              message.id === optimistic.id ? { ...message, status: 'sent' } : message,
            ),
          );
        }

        if (result.threadId && result.threadId !== threadId) {
          router.replace(`/(app)/inbox/${result.threadId}` as Href);
        }
      } catch (error) {
        setLocalMessages((current) =>
          current.map((message) =>
            message.id === optimistic.id ? { ...message, status: 'failed' } : message,
          ),
        );
        Alert.alert('Send failed', error instanceof Error ? error.message : 'Unable to send message.');
      } finally {
        setIsSending(false);
      }
    },
    [activeInbox?.id, router, threadId, userId],
  );

  const openOverflowMenu = useCallback(() => {
    if (!thread || !userId) {
      return;
    }

    const unread = isThreadUnread(thread, readAt);

    Alert.alert(formatThreadTitle(thread), undefined, [
      {
        text: 'Edit display name',
        onPress: () => {
          setEditNameOpen(true);
        },
      },
      unread
        ? {
            text: 'Mark read',
            onPress: () => {
              void upsertThreadRead(userId, thread.id).then(() => {
                setReadAt(new Date().toISOString());
              });
            },
          }
        : {
            text: 'Mark unread',
            onPress: () => {
              void markThreadUnread(userId, thread.id).then(() => {
                setReadAt('1970-01-01T00:00:00.000Z');
              });
            },
          },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [readAt, thread, userId]);

  const toggleDone = useCallback(async () => {
    if (!thread) {
      return;
    }

    try {
      if (thread.archived_at) {
        await reopenThread(thread.id);
      } else {
        await markThreadDone(thread.id);
      }
      const next = await fetchThreadById(thread.id);
      setThread(next);
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update thread.');
    }
  }, [thread]);

  return (
    <View style={styles.screen}>
      <ConversationHeader
        title={thread ? formatThreadTitle(thread) : 'Conversation'}
        subtitle={thread?.customer_e164 ?? undefined}
        isDone={isDone}
        onBack={() => {
          router.back();
        }}
        onToggleDone={() => {
          void toggleDone();
        }}
        onOpenMenu={openOverflowMenu}
      />

      <View style={styles.messagesPane}>
        <MessageList
          messages={mergedMessages}
          currentUserId={userId ?? ''}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadOlder={() => {
            void loadOlder();
          }}
        />
      </View>

      <Composer
        disabled={!canSend}
        disabledReason={canSend ? undefined : 'This inbox is history-only. Sending is disabled.'}
        isSending={isSending}
        onSend={handleSend}
      />

      <EditDisplayNameModal
        visible={editNameOpen}
        initialValue={thread?.display_name ?? ''}
        onClose={() => setEditNameOpen(false)}
        onSave={(value) => {
          if (!thread) {
            return;
          }
          void updateThreadDisplayName(thread.id, value).then(() => {
            void fetchThreadById(thread.id).then(setThread);
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.canvas,
  },
  messagesPane: {
    flex: 1,
  },
});
