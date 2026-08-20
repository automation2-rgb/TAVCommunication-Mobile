import { queryContactsDirectory } from '@/lib/messaging/contacts';
import { supabase } from '@/lib/supabase';
import type { SearchMatchedMessage, SearchResultRow, SearchThreadHit } from '@/types/search';

export class SearchApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchApiError';
  }
}

const SEARCH_THREAD_SELECT =
  'id, inbox_id, customer_e164, thread_kind, display_name, contact_id, last_message_at, contacts ( display_name ), thread_participants ( participant_e164 )';

const MESSAGE_ENRICH_SELECT =
  'id, thread_id, body, created_at, direction, sent_by, sender_profile:profiles!messages_sent_by_fkey ( id, display_name )';

const MAX_MATCHED_MESSAGES_PER_THREAD = 5;
const MAX_RESULTS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeThreadRow(value: unknown): SearchThreadHit | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.inbox_id !== 'string') {
    return null;
  }

  const contactsRaw = value.contacts;
  const contacts = Array.isArray(contactsRaw)
    ? contactsRaw[0] && isRecord(contactsRaw[0])
      ? { display_name: typeof contactsRaw[0].display_name === 'string' ? contactsRaw[0].display_name : null }
      : null
    : isRecord(contactsRaw)
      ? { display_name: typeof contactsRaw.display_name === 'string' ? contactsRaw.display_name : null }
      : null;

  const participantsRaw = value.thread_participants;
  const thread_participants = Array.isArray(participantsRaw)
    ? participantsRaw
        .map((participant) => {
          if (!isRecord(participant) || typeof participant.participant_e164 !== 'string') {
            return null;
          }
          return { participant_e164: participant.participant_e164 };
        })
        .filter((participant): participant is { participant_e164: string } => participant !== null)
    : undefined;

  return {
    id: value.id,
    inbox_id: value.inbox_id,
    customer_e164: typeof value.customer_e164 === 'string' ? value.customer_e164 : null,
    thread_kind: typeof value.thread_kind === 'string' ? value.thread_kind : 'direct',
    display_name: typeof value.display_name === 'string' ? value.display_name : null,
    contact_id: typeof value.contact_id === 'string' ? value.contact_id : null,
    contacts,
    last_message_at: typeof value.last_message_at === 'string' ? value.last_message_at : null,
    thread_participants,
  };
}

function normalizeMatchedMessage(value: unknown): SearchMatchedMessage | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null;
  }

  const senderRaw = value.sender_profile;
  const sender_profile =
    isRecord(senderRaw) && typeof senderRaw.id === 'string'
      ? {
          id: senderRaw.id,
          display_name: typeof senderRaw.display_name === 'string' ? senderRaw.display_name : null,
        }
      : undefined;

  return {
    id: value.id,
    body: typeof value.body === 'string' ? value.body : null,
    created_at: typeof value.created_at === 'string' ? value.created_at : new Date().toISOString(),
    direction: value.direction === 'outbound' ? 'outbound' : 'inbound',
    sent_by: typeof value.sent_by === 'string' ? value.sent_by : null,
    sender_profile,
  };
}

function normalizeThreadIdRows(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((row) => {
      if (typeof row === 'string') {
        return row;
      }
      if (isRecord(row) && typeof row.id === 'string') {
        return row.id;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

function normalizeMessageMatches(payload: unknown): Array<SearchMatchedMessage & { thread_id: string }> {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((row) => {
      if (!isRecord(row) || typeof row.id !== 'string' || typeof row.thread_id !== 'string') {
        return null;
      }

      const message = normalizeMatchedMessage(row);
      if (!message) {
        return null;
      }

      return { ...message, thread_id: row.thread_id };
    })
    .filter((row): row is SearchMatchedMessage & { thread_id: string } => row !== null);
}

function threadTime(thread: SearchThreadHit): number {
  if (!thread.last_message_at) {
    return 0;
  }
  const parsed = Date.parse(thread.last_message_at);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function enrichMessages(
  messageMatches: Array<SearchMatchedMessage & { thread_id: string }>,
): Promise<Array<SearchMatchedMessage & { thread_id: string }>> {
  const messageIds = messageMatches.map((message) => message.id);
  if (messageIds.length === 0) {
    return messageMatches;
  }

  const { data, error } = await supabase.from('messages').select(MESSAGE_ENRICH_SELECT).in('id', messageIds);
  if (error) {
    throw new SearchApiError(error.message || 'Search failed');
  }

  const enrichedById = new Map<string, SearchMatchedMessage>();
  for (const row of data ?? []) {
    const normalized = normalizeMatchedMessage(row);
    if (normalized) {
      enrichedById.set(normalized.id, normalized);
    }
  }

  return messageMatches.map((message) => {
    const enriched = enrichedById.get(message.id);
    if (!enriched) {
      return message;
    }
    return { ...message, ...enriched, thread_id: message.thread_id };
  });
}

async function hydrateThreads(threadIds: string[]): Promise<SearchThreadHit[]> {
  if (threadIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from('threads').select(SEARCH_THREAD_SELECT).in('id', threadIds);
  if (error) {
    throw new SearchApiError(error.message || 'Search failed');
  }

  return (data ?? [])
    .map(normalizeThreadRow)
    .filter((thread): thread is SearchThreadHit => thread !== null);
}

async function hydrateThreadsByPhone(contactPhones: string[]): Promise<SearchThreadHit[]> {
  if (contactPhones.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('threads')
    .select(SEARCH_THREAD_SELECT)
    .in('customer_e164', contactPhones)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    throw new SearchApiError(error.message || 'Search failed');
  }

  return (data ?? [])
    .map(normalizeThreadRow)
    .filter((thread): thread is SearchThreadHit => thread !== null);
}

async function attachInboxNames(results: SearchResultRow[]): Promise<SearchResultRow[]> {
  const inboxIds = [...new Set(results.map((result) => result.thread.inbox_id))];
  if (inboxIds.length === 0) {
    return results;
  }

  const { data, error } = await supabase.from('inboxes').select('id, display_name').in('id', inboxIds);
  if (error) {
    throw new SearchApiError(error.message || 'Search failed');
  }

  const inboxNames = new Map(
    (data ?? []).map((inbox) => [inbox.id, typeof inbox.display_name === 'string' ? inbox.display_name : null]),
  );

  return results.map((result) => ({
    ...result,
    inbox_display_name: inboxNames.get(result.thread.inbox_id) ?? result.inbox_display_name,
  }));
}

/**
 * Workspace search via Supabase RPCs (same logic as GET /api/search on web).
 * Uses the mobile session directly so results respect RLS without Vercel Bearer quirks.
 */
export async function fetchWorkspaceSearch(query: string): Promise<SearchResultRow[]> {
  const trimmed = query.trim().slice(0, 100);
  if (trimmed.length < 3) {
    return [];
  }

  const [threadIdResult, messageResult, contactResult] = await Promise.all([
    supabase.rpc('search_thread_ids_for_workspace', { p_query: trimmed, p_limit: 30 }),
    supabase.rpc('search_messages_for_workspace', { p_query: trimmed, p_limit: 40 }),
    queryContactsDirectory(trimmed, 25).catch(() => []),
  ]);

  if (threadIdResult.error) {
    throw new SearchApiError(threadIdResult.error.message || 'Search failed');
  }
  if (messageResult.error) {
    throw new SearchApiError(messageResult.error.message || 'Search failed');
  }

  const messageMatches = normalizeMessageMatches(messageResult.data);
  const threadIds = new Set<string>([
    ...normalizeThreadIdRows(threadIdResult.data),
    ...messageMatches.map((message) => message.thread_id),
  ]);

  const enrichedMessages = await enrichMessages(messageMatches);
  const hydratedThreads = await hydrateThreads([...threadIds]);

  const resultMap = new Map<string, SearchResultRow>();

  for (const thread of hydratedThreads) {
    const matchedMessages = enrichedMessages
      .filter((message) => message.thread_id === thread.id)
      .slice(0, MAX_MATCHED_MESSAGES_PER_THREAD)
      .map(({ thread_id: _threadId, ...message }) => message);

    resultMap.set(thread.id, {
      kind: 'thread',
      thread,
      matchedMessages,
      subtitle: null,
      inbox_display_name: null,
    });
  }

  const contactPhones = [
    ...new Set(
      contactResult
        .map((contact) => contact.phone_e164?.trim())
        .filter((phone): phone is string => Boolean(phone)),
    ),
  ];

  const contactLinkedThreads = await hydrateThreadsByPhone(contactPhones);
  for (const thread of contactLinkedThreads) {
    const existing = resultMap.get(thread.id);
    if (existing) {
      if (existing.matchedMessages.length === 0 && !existing.subtitle) {
        existing.subtitle = 'Contact directory';
      }
      continue;
    }

    resultMap.set(thread.id, {
      kind: 'thread',
      thread,
      matchedMessages: [],
      subtitle: 'Contact directory',
      inbox_display_name: null,
    });
  }

  const sorted = [...resultMap.values()]
    .sort((a, b) => threadTime(b.thread) - threadTime(a.thread))
    .slice(0, MAX_RESULTS);

  return attachInboxNames(sorted);
}
