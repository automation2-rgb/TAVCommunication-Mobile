import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Composer, type ComposerSendPayload } from '@/components/inbox/composer';
import { ConversationHeader } from '@/components/inbox/conversation-header';
import { EditDisplayNameModal } from '@/components/inbox/edit-display-name-modal';
import { MessageList } from '@/components/inbox/message-list';
import { InCallOverlay } from '@/components/voice/in-call-overlay';
import { ThreadVoiceCallControls } from '@/components/voice/thread-voice-call-controls';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useVoiceClient } from '@/contexts/voice-client';
import { useThreadMessages } from '@/hooks/use-thread-messages';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  createOptimisticMessage,
  createPendingAttachmentPreviews,
  sendDirectMessage,
  type PendingAttachmentPreview,
} from '@/lib/messaging/send-message';
import { fetchThreadById, formatThreadTitle, resolveOutboundSendTarget } from '@/lib/messaging/threads';
import { canPlaceThreadVoiceCall } from '@/lib/voice/voice-enabled';
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
  const { placeOutboundCall, ensureReady } = useVoiceClient();

  const [thread, setThread] = useState<Thread | null>(null);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [pendingAttachmentsByMessageId, setPendingAttachmentsByMessageId] = useState<
    Record<string, PendingAttachmentPreview[]>
  >({});
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
  const canCall = canPlaceThreadVoiceCall(thread, activeInbox);
  const isDone = Boolean(thread?.archived_at);
  const contactLabel = thread ? formatThreadTitle(thread) : 'Customer';

  const handleSend = useCallback(
    async ({ body, files }: ComposerSendPayload) => {
      if (!userId || !activeInbox?.id || !threadId) {
        return;
      }

      const resolvedThread = thread ?? (await fetchThreadById(threadId));
      if (!resolvedThread) {
        Alert.alert('Unable to send', 'Conversation not found.');
        return;
      }

      const target = resolveOutboundSendTarget(resolvedThread);
      if (target.kind === 'unsupported') {
        Alert.alert('Cannot send here', target.reason);
        return;
      }

      const optimistic = createOptimisticMessage({
        threadId,
        body,
        sentBy: userId,
      });
      const pendingAttachments = createPendingAttachmentPreviews(optimistic.id, files);

      setLocalMessages((current) => upsertMessage(current, optimistic));
      if (pendingAttachments.length > 0) {
        setPendingAttachmentsByMessageId((current) => ({
          ...current,
          [optimistic.id]: pendingAttachments,
        }));
      }
      setIsSending(true);

      try {
        const result = await sendDirectMessage({
          inboxId: activeInbox.id,
          threadId: target.kind === 'thread' ? target.threadId : undefined,
          toE164: target.kind === 'to' ? target.toE164 : undefined,
          fallbackThreadId: threadId,
          body,
          files,
        });

        setLocalMessages((current) =>
          current.map((message) => {
            if (message.id !== optimistic.id) {
              return message;
            }
            if (result.message) {
              return { ...message, ...result.message, thread_id: result.threadId };
            }
            return { ...message, status: 'sent' };
          }),
        );
        setPendingAttachmentsByMessageId((current) => {
          const pending = current[optimistic.id];
          if (!pending?.length) {
            return current;
          }

          const next = { ...current };
          delete next[optimistic.id];

          const savedMessageId = result.message?.id;
          if (savedMessageId && savedMessageId !== optimistic.id) {
            next[savedMessageId] = pending.map((attachment) => ({
              ...attachment,
              id: attachment.id.replace(optimistic.id, savedMessageId),
            }));
          }

          return next;
        });

        if (result.threadId !== threadId) {
          router.replace(`/(app)/inbox/${result.threadId}` as Href);
        }
      } catch (error) {
        setLocalMessages((current) =>
          current.map((message) =>
            message.id === optimistic.id ? { ...message, status: 'failed' } : message,
          ),
        );
        const message = error instanceof Error ? error.message : 'Unable to send message.';
        Alert.alert('Send failed', message);
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setIsSending(false);
      }
    },
    [activeInbox?.id, router, thread, threadId, userId],
  );

  const handlePlaceCall = useCallback(async () => {
    if (!thread || !activeInbox?.id || !thread.customer_e164) {
      return;
    }

    await ensureReady();
    await placeOutboundCall({
      threadId: thread.id,
      inboxId: activeInbox.id,
      customerE164: thread.customer_e164,
      contactLabel,
    });
  }, [activeInbox?.id, contactLabel, ensureReady, placeOutboundCall, thread]);

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
        phoneE164={thread?.customer_e164}
        isDone={isDone}
        onBack={() => {
          router.back();
        }}
        onToggleDone={() => {
          void toggleDone();
        }}
        onOpenMenu={openOverflowMenu}
        voiceControls={
          canCall ? <ThreadVoiceCallControls onCall={handlePlaceCall} /> : undefined
        }
      />

      <InCallOverlay contactLabel={contactLabel} />

      <View style={styles.messagesPane}>
        <MessageList
          messages={mergedMessages}
          currentUserId={userId ?? ''}
          pendingAttachmentsByMessageId={pendingAttachmentsByMessageId}
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
