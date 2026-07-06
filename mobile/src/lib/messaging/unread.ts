import type { MessageDirection, Thread } from '@/types/messaging';

export function isThreadUnread(
  thread: Thread,
  readAt: string | null | undefined,
  options?: { forceUnread?: boolean },
): boolean {
  if (options?.forceUnread) {
    return true;
  }

  if (!thread.last_message_at) {
    return false;
  }

  if (thread.last_message_direction !== 'inbound') {
    return false;
  }

  if (!readAt) {
    return true;
  }

  return new Date(thread.last_message_at).getTime() > new Date(readAt).getTime();
}

export function countUnreadThreads(
  threads: Thread[],
  readMap: Map<string, string>,
  forcedUnreadThreadIds?: Set<string>,
): number {
  return threads.filter((thread) =>
    isThreadUnread(thread, readMap.get(thread.id), {
      forceUnread: forcedUnreadThreadIds?.has(thread.id),
    }),
  ).length;
}

export function shouldAutoMarkRead(params: {
  threadId: string;
  latestInboundMessageAt: string | null;
  readAt: string | null | undefined;
}): boolean {
  if (!params.latestInboundMessageAt) {
    return false;
  }

  if (!params.readAt) {
    return true;
  }

  return new Date(params.latestInboundMessageAt).getTime() > new Date(params.readAt).getTime();
}

export function latestInboundTimestamp(
  messages: Array<{ direction: MessageDirection; created_at: string }>,
): string | null {
  const inbound = messages.find((message) => message.direction === 'inbound');
  return inbound?.created_at ?? null;
}
