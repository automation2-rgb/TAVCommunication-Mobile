import { Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getEmptyStateForTab, InboxEmptyState } from '@/components/inbox/empty-state';
import { InboxHeader } from '@/components/inbox/inbox-header';
import { InboxSwitcherSheet } from '@/components/inbox/inbox-switcher-sheet';
import { RequestInboxAccessPanel } from '@/components/inbox/request-inbox-access-panel';
import { SwipeableThreadRow } from '@/components/inbox/swipeable-thread-row';
import { ThreadTabs } from '@/components/inbox/thread-tabs';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useInboxThreads } from '@/hooks/use-inbox-threads';
import { fetchInboxUnreadCount } from '@/lib/messaging/inbox-unread';
import { markThreadUnread, upsertThreadRead } from '@/lib/messaging/thread-reads';
import { markThreadDone, reopenThread } from '@/lib/messaging/thread-archive';
import { isThreadUnread } from '@/lib/messaging/unread';
import { tavColors } from '@/lib/theme';
import { useAuth } from '@/lib/auth/auth-provider';
import type { Thread } from '@/types/messaging';

export default function InboxListScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const {
    inboxes,
    activeInbox,
    activeInboxId,
    setActiveInboxId,
    activeTab,
    setActiveTab,
    isLoadingInboxes,
    inboxesError,
    refreshInboxes,
  } = useInboxWorkspace();

  const { threads, readMap, unreadCount, isLoading, error, refresh, setReadMap } = useInboxThreads({
    userId,
    inboxId: activeInboxId ?? undefined,
    tab: activeTab,
  });

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userId || inboxes.length === 0) {
      return;
    }

    let cancelled = false;
    void Promise.all(
      inboxes.map(async (inbox) => {
        const count = await fetchInboxUnreadCount(userId, inbox.id);
        return [inbox.id, count] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setUnreadCounts(Object.fromEntries(entries));
        }
      })
      .catch(() => {
        // Badge counts are optional; ignore fetch failures.
      });

    return () => {
      cancelled = true;
    };
  }, [inboxes, userId, threads.length, unreadCount]);

  const historyOnly = !activeInbox?.twilio_phone_e164;
  const emptyCopy = getEmptyStateForTab(activeTab === 'done' ? 'done' : activeTab === 'unread' ? 'unread' : 'active', historyOnly);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshInboxes(), refresh()]);
    setRefreshing(false);
  }, [refresh, refreshInboxes]);

  const handleSwipeThreadAction = useCallback(
    async (thread: Thread) => {
      const isDone = Boolean(thread.archived_at);

      try {
        if (isDone) {
          await reopenThread(thread.id);
        } else {
          await markThreadDone(thread.id);
        }
        await refresh();
      } catch (actionError) {
        Alert.alert(
          isDone ? 'Unable to reopen' : 'Unable to mark done',
          actionError instanceof Error ? actionError.message : 'Please try again.',
        );
      }
    },
    [refresh],
  );

  const openThreadActions = useCallback(
    (thread: Thread) => {
      const unread = isThreadUnread(thread, readMap.get(thread.id));
      const isDone = Boolean(thread.archived_at);

      Alert.alert(formatThreadAlertTitle(thread), undefined, [
        unread
          ? {
              text: 'Mark read',
              onPress: () => {
                if (!userId) return;
                void upsertThreadRead(userId, thread.id).then(() => {
                  setReadMap((current) => {
                    const next = new Map(current);
                    next.set(thread.id, new Date().toISOString());
                    return next;
                  });
                });
              },
            }
          : {
              text: 'Mark unread',
              onPress: () => {
                if (!userId) return;
                void markThreadUnread(userId, thread.id).then(() => {
                  setReadMap((current) => {
                    const next = new Map(current);
                    next.set(thread.id, '1970-01-01T00:00:00.000Z');
                    return next;
                  });
                });
              },
            },
        isDone
          ? {
              text: 'Reopen deal',
              onPress: () => {
                void reopenThread(thread.id).then(refresh);
              },
            }
          : {
              text: 'Mark done',
              onPress: () => {
                void markThreadDone(thread.id).then(refresh);
              },
            },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [readMap, refresh, setReadMap, userId],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <ThreadTabs activeTab={activeTab} unreadCount={unreadCount} onChange={setActiveTab} />
      </View>
    ),
    [activeTab, setActiveTab, unreadCount],
  );

  if (isLoadingInboxes) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={tavColors.blue} size="large" />
      </View>
    );
  }

  if (inboxes.length === 0) {
    return (
      <View style={styles.screen}>
        <InboxHeader
          inboxName="Inbox"
          onOpenInboxSwitcher={() => {}}
        />
        <RequestInboxAccessPanel />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <InboxHeader
        inboxName={activeInbox?.display_name ?? 'Inbox'}
        inboxUnreadCount={unreadCount}
        onOpenInboxSwitcher={() => setSwitcherOpen(true)}
        onCompose={() => {
          router.push('/(app)/inbox/compose');
        }}
      />

      {inboxesError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{inboxesError.message}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : null}

      {isLoading && threads.length === 0 ? (
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={tavColors.blue} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <SwipeableThreadRow
              thread={item}
              readAt={readMap.get(item.id)}
              swipeAction={activeTab === 'done' ? 'reopen' : 'mark-done'}
              onPress={() => {
                router.push(`/(app)/inbox/${item.id}` as Href);
              }}
              onLongPress={() => {
                openThreadActions(item);
              }}
              onSwipeAction={() => handleSwipeThreadAction(item)}
            />
          )}
          ListEmptyComponent={
            <InboxEmptyState
              title={emptyCopy.title}
              description={emptyCopy.description}
              variant={emptyCopy.variant}
            />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
          contentContainerStyle={threads.length === 0 ? styles.emptyList : undefined}
          style={styles.list}
        />
      )}

      <InboxSwitcherSheet
        visible={switcherOpen}
        inboxes={inboxes}
        activeInboxId={activeInboxId}
        unreadCounts={unreadCounts}
        onSelect={setActiveInboxId}
        onClose={() => setSwitcherOpen(false)}
      />
    </View>
  );
}

function formatThreadAlertTitle(thread: Thread) {
  return thread.display_name?.trim() || thread.customer_e164 || 'Conversation';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.threadListBg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.threadListBg,
  },
  list: {
    flex: 1,
    backgroundColor: tavColors.threadListBg,
  },
  listHeader: {
    backgroundColor: tavColors.threadListBg,
    paddingTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: tavColors.amber50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: tavColors.amber900,
    fontSize: 14,
  },
});
