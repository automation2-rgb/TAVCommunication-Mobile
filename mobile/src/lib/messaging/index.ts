export { listContactsDirectoryPage, queryContactsDirectory, searchTeamProfiles } from '@/lib/messaging/contacts';
export type { ListContactsPageParams, ListContactsPageResult } from '@/lib/messaging/contacts';
export { fetchUserInboxes } from '@/lib/messaging/inboxes';
export {
  MESSAGE_PAGE_SIZE,
  fetchMessagesPage,
  mergeMessagesById,
  removeMessage,
  upsertMessage,
} from '@/lib/messaging/messages';
export type { FetchMessagesPageOptions, MessagesPage } from '@/lib/messaging/messages';
export {
  mergeThreadList,
  removeThreadFromList,
  subscribeToInboxThreads,
  subscribeToThreadMessages,
  unsubscribeChannel,
} from '@/lib/messaging/realtime';
export type { MessageRealtimeHandlers, ThreadRealtimeHandlers } from '@/lib/messaging/realtime';
export {
  buildThreadReadMap,
  cancelScheduledMarkThreadRead,
  fetchThreadReads,
  markThreadUnread,
  scheduleMarkThreadRead,
  upsertThreadRead,
} from '@/lib/messaging/thread-reads';
export { fetchThreadById, fetchThreadsForInbox, formatThreadTitle } from '@/lib/messaging/threads';
export {
  countUnreadThreads,
  isThreadUnread,
  latestInboundTimestamp,
  shouldAutoMarkRead,
} from '@/lib/messaging/unread';
