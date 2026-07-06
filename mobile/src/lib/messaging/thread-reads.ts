import { supabase } from '@/lib/supabase';
import type { ThreadRead } from '@/types/messaging';

export async function fetchThreadReads(userId: string, threadIds: string[] = []): Promise<ThreadRead[]> {
  const { data, error } = await supabase
    .from('thread_reads')
    .select('user_id, thread_id, read_at')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const reads = (data ?? []) as ThreadRead[];

  if (threadIds.length === 0) {
    return reads;
  }

  const threadIdSet = new Set(threadIds);
  return reads.filter((read) => threadIdSet.has(read.thread_id));
}

export async function upsertThreadRead(userId: string, threadId: string, readAt: string = new Date().toISOString()) {
  const { error } = await supabase.from('thread_reads').upsert(
    {
      user_id: userId,
      thread_id: threadId,
      read_at: readAt,
    },
    { onConflict: 'user_id,thread_id' },
  );

  if (error) {
    throw error;
  }
}

/** Forces unread by setting read_at before any realistic message timestamp. */
export async function markThreadUnread(userId: string, threadId: string) {
  await upsertThreadRead(userId, threadId, '1970-01-01T00:00:00.000Z');
}

const debouncedTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleMarkThreadRead(userId: string, threadId: string, delayMs = 400) {
  const key = `${userId}:${threadId}`;
  const existing = debouncedTimers.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    debouncedTimers.delete(key);
    void upsertThreadRead(userId, threadId);
  }, delayMs);

  debouncedTimers.set(key, timer);
}

export function cancelScheduledMarkThreadRead(userId: string, threadId: string) {
  const key = `${userId}:${threadId}`;
  const existing = debouncedTimers.get(key);
  if (existing) {
    clearTimeout(existing);
    debouncedTimers.delete(key);
  }
}

export function buildThreadReadMap(reads: ThreadRead[]): Map<string, string> {
  return new Map(reads.map((read) => [read.thread_id, read.read_at]));
}
