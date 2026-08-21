import { buildThreadReadMap, fetchThreadReads } from '@/lib/messaging/thread-reads';
import { fetchThreadsForInbox } from '@/lib/messaging/threads';
import { countUnreadThreads } from '@/lib/messaging/unread';

export async function fetchInboxUnreadCount(userId: string, inboxId: string): Promise<number> {
  const threads = await fetchThreadsForInbox(inboxId, 'active');
  if (threads.length === 0) {
    return 0;
  }

  const reads = await fetchThreadReads(
    userId,
    threads.map((thread) => thread.id),
  );

  return countUnreadThreads(threads, buildThreadReadMap(reads));
}

export async function fetchTotalInboxUnreadCount(userId: string, inboxIds: string[]): Promise<number> {
  if (inboxIds.length === 0) {
    return 0;
  }

  const counts = await Promise.all(inboxIds.map((inboxId) => fetchInboxUnreadCount(userId, inboxId)));
  return counts.reduce((total, count) => total + count, 0);
}
