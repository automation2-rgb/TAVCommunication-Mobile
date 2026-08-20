import type { SearchMatchedMessage, SearchPressableRow, SearchRecentThread, SearchResultRow, SearchThreadHit } from '@/types/search';

export const SEARCH_DEBOUNCE_MS = 450;
export const SEARCH_MIN_QUERY_LENGTH = 3;
export const SEARCH_HIGHLIGHT_MS = 2200;
export const SEARCH_MAX_HIGHLIGHT_LOAD_ATTEMPTS = 24;

export function formatUsPhoneNumber(e164: string | null | undefined): string {
  if (!e164) {
    return '';
  }

  const digits = e164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return e164;
}

export function getSearchThreadTitle(thread: SearchThreadHit): string {
  if (thread.display_name?.trim()) {
    return thread.display_name.trim();
  }

  if (thread.contacts?.display_name?.trim()) {
    return thread.contacts.display_name.trim();
  }

  const kind = thread.thread_kind;
  if (kind === 'app_group' || kind === 'group_mms') {
    const participants = thread.thread_participants ?? [];
    if (participants.length > 0) {
      return participants
        .map((participant) => formatUsPhoneNumber(participant.participant_e164))
        .filter(Boolean)
        .join(', ');
    }
    return 'Group chat';
  }

  if (thread.customer_e164) {
    return formatUsPhoneNumber(thread.customer_e164) || thread.customer_e164;
  }

  return 'Group chat';
}

export function messageOutboundPreviewPrefix(
  message: SearchMatchedMessage,
  currentUserName?: string | null,
): string {
  if (message.direction !== 'outbound') {
    return '';
  }

  const senderName = message.sender_profile?.display_name?.trim() || currentUserName?.trim() || 'You';
  return `${senderName}: `;
}

export function formatSearchMessagePreview(
  message: SearchMatchedMessage,
  currentUserName?: string | null,
): string {
  const prefix = messageOutboundPreviewPrefix(message, currentUserName);
  const body = message.body?.trim();
  if (body) {
    return `${prefix}${body}`;
  }
  return `${prefix}(attachment)`;
}

export function formatRecentThreadPreview(thread: SearchRecentThread): string {
  const raw = thread.last_message_body?.trim() || 'No messages yet';
  if (thread.last_message_direction === 'outbound') {
    return `You: ${raw}`;
  }
  return raw;
}

export function flattenSearchResults(results: SearchResultRow[]): SearchPressableRow[] {
  const rows: SearchPressableRow[] = [];

  for (const result of results) {
    const inboxId = result.thread.inbox_id;
    const threadId = result.thread.id;
    const inboxDisplayName = result.inbox_display_name;

    if (result.matchedMessages.length > 0) {
      for (const message of result.matchedMessages) {
        rows.push({
          key: `message-${message.id}`,
          kind: 'message',
          inboxId,
          threadId,
          messageId: message.id,
          thread: result.thread,
          message,
          inboxDisplayName,
        });
      }
      continue;
    }

    rows.push({
      key: `thread-${threadId}`,
      kind: 'thread',
      inboxId,
      threadId,
      thread: result.thread,
      subtitle: result.subtitle,
      inboxDisplayName,
    });
  }

  return rows;
}
