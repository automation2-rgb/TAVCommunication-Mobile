# Inbox and direct messaging

How the SMS inbox works for 1:1 (direct) conversations — UI, procedures, backend, and edge cases.

**Primary UI:** `web/app/inbox/inbox-messenger.tsx` (~5000 lines)  
**Page SSR:** `web/app/(workspace)/inbox/page.tsx`

---

## Landing on inbox

### Server-side (first paint)

1. `requireApprovedMessagingUser()` — must be approved org user
2. Load accessible `inboxes` for user
3. Load thread list for selected inbox (`?inbox=` or first inbox)
4. Load first page of messages for selected thread (`?thread=`) or top active thread
5. Exclude archived (“Done”) threads from auto-selection unless explicitly requested
6. Compose mode (`?compose=1`) skips auto thread select

### Client hydration

- Subscribe to Supabase Realtime for threads and open thread messages
- Merge SSR data with local caches (`messagesCacheRef`)
- Initialize read state from `thread_reads` + localStorage helpers
- Register service worker for background notifications

---

## Inbox layout (direct messaging context)

See [workspace-layout-and-navigation.md](../ui/workspace-layout-and-navigation.md).

**Three columns (desktop):**

1. **Thread list** — filters, rows, hover actions
2. **Conversation** — header, messages, composer
3. **Side panel** — contact details, notes, properties

**URL:** `/inbox?inbox=<uuid>&thread=<uuid>`

---

## Thread list filters

| Tab | Label in UI | Filter logic |
|-----|-------------|--------------|
| Active | Active | `archived_at` is null |
| Unread | Unread | Active + thread is unread for current user |
| Done Deals | Done Deals | `archived_at` is set |

### Thread row display

- **Title:** `display_name` or formatted phone or contact name
- **Snippet:** `{sender prefix}{last_message_body}`
- **Outbound prefix:** Teammate display name when last message was outbound from another user
- **Timestamp:** Relative time from `last_message_at`
- **Unread indicator:** Bold/dot when unread

### Row hover actions (desktop)

| Action | Effect |
|--------|--------|
| Mark read / Mark unread | Updates `thread_reads` for current user |
| Mark done / Reopen | Team-wide archive via hide API |

---

## Unread logic

A thread is unread when:

- User has no `thread_reads` row and last message is inbound, **or**
- `last_message_at` is after user’s `read_at`, **or**
- User explicitly marked unread (requires prior read record)

**Mark read:** Opening thread and viewing latest inbound triggers debounced upsert to `thread_reads`.

**Mark unread:** Manual action from thread list — only if user had read the thread before.

---

## Selecting and reading a thread

1. User clicks thread row
2. URL updates with `thread=<uuid>`
3. Messages load from cache or fetch (page size 75, newest first)
4. Scroll up loads older messages (infinite scroll)
5. **Virtualization:** List virtualized when ≥48 messages
6. Auto mark-read when last inbound visible

### Message bubble layout

| Direction | Alignment | Details |
|-----------|-----------|---------|
| Inbound | Left | Gray bubble; external sender |
| Outbound | Right | Brand-colored bubble; teammate name if not self |

**Status icon (outbound):** `MessageStatusIcon` — queued → sent → delivered / failed

**Attachments:** Inline thumbnails; tap opens `message-attachment-lightbox` with gallery, download, open in new tab

---

## New 1:1 conversation

### Via UI

1. Click **New conversation**
2. `selectedThreadId = "new"` — empty conversation pane
3. `OutboundContactRecipientPicker` — search contacts or enter E.164
4. User types message and sends
5. API creates thread on first send
6. Client finds thread by `(inbox_id, customer_e164)` and selects it

### Via deep link

`/inbox?inbox=<uuid>&compose=1&to=+15551234567`

### Via contacts / team

Contacts and team pages navigate to compose deep link with pre-filled `to`.

---

## Sending a message (existing direct thread)

### User steps

1. Focus composer at bottom of conversation
2. Type text and/or attach files (drag-drop on conversation pane)
3. Press Enter or Send button

### Client behavior

1. `ensureBrowserSessionFresh()` — refresh session if needed
2. Insert **optimistic** bubble with `status: "sending"`
3. `POST /api/messages/send` with `{ inbox_id, thread_id, body }` or multipart for MMS
4. On success: reconcile message ID and status; clear Done state optimistically; silent reload
5. On failure: show error; retry preserves files in `failedSendFilesRef`

### Server path

```
POST /api/messages/send
  → getApprovedApiUser()
  → userCanSendInbox(inbox_id)
  → sendDirect1To1ViaConversations()
  → ensureConversationForSmsThread()
  → sendConversationSmsMessage()
  → update messages row with Twilio SID + status
```

### Composer constraints

| Rule | Value |
|------|-------|
| SMS body max | `TWILIO_SMS_BODY_MAX_LENGTH` (1600 in help docs) |
| MMS files | Max 10, 5 MB each |
| MMS types | Images, short audio/video — carrier-safe only (no PDFs) |
| Send disabled | When inbox has no `twilio_phone_e164` (history-only) |

---

## Done Deals (archive)

**Purpose:** Team-wide “deal closed” state — hides thread from Active/Unread, shows under Done.

| Action | API | DB effect |
|--------|-----|-----------|
| Mark done | `POST /api/threads/[id]/hide` | Sets `archived_at`, `archived_by` |
| Reopen | `DELETE /api/threads/[id]/hide` | Clears archive fields |

**Auto-reopen:** New inbound or outbound activity clears `archived_at` (DB + client). If user is on Done tab when thread reopens, selection clears.

**Outbound send:** Client optimistically removes Done state immediately.

---

## Voice call from thread (1:1 only)

**Component:** `thread-voice-call-controls`

- Outbound browser call button on direct threads
- Requires inbox Twilio number and user send access
- See [08-voice-calls.md](./08-voice-calls.md)

---

## History-only inbox

Inbox exists in DB but `twilio_phone_e164` is null:

- Threads and messages visible (historical)
- Composer disabled
- Send API would reject

---

## Inbound message flow (what user sees)

1. Twilio webhook inserts message (see [twilio-integration-map.md](../reference/twilio-integration-map.md))
2. Realtime fires on `messages` / `threads` UPDATE
3. If thread open: message appears in list (batched via rAF)
4. If other thread: thread list updates; unread badge increments
5. If tab backgrounded: OS notification via service worker + optional sound
6. If tab focused on different thread: optional in-app toast

---

## Message status lifecycle

| Status | User-visible meaning |
|--------|---------------------|
| sending | Optimistic local only |
| queued | Accepted, awaiting Twilio |
| sent | Twilio accepted |
| delivered | Carrier delivery confirmed |
| failed / undelivered | Red status icon; retry available |

Updates via Twilio `onDeliveryUpdated` and `/api/twilio/status`.

---

## Developer mode interaction

`/inbox?dev=1` replaces thread list with dev dashboard — normal 1:1 messaging unavailable until exit. See [10-developer-admin-console.md](./10-developer-admin-console.md).

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Session expired mid-send | Session refresh attempted; may redirect to login |
| Duplicate inbound webhook | Idempotent — no duplicate bubble |
| Same phone in 1:1 and group | Inbound goes to most recently active thread |
| Multi-image MMS outbound | Each image = separate message row |
| Compose draft in list preview | Selected row may show snippet from composer draft |
| Realtime auth not synced | Subscriptions fail silently until page reload |
| Failed send retry | Attachments preserved in ref for retry |
| Thread list on wrong inbox | URL `inbox` param is source of truth after navigation |

---

## Inbox mobile chrome

On `/inbox`, workspace hamburger is **hidden** (`showMobileChrome = pathname !== "/inbox"`). Inbox provides its own header:

- Inbox name picker (opens `InboxSelectorSheet`)
- TAV logo + “Messages” (desktop)
- Search button
- User menu

See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

---

## Empty states

Full variant table and “all inboxes hidden” state: [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

| Tab / context | Empty message gist |
|---------------|-------------------|
| Active, no threads | “No conversations yet” |
| Unread empty | “All caught up” |
| Done empty | “No done deals yet” |
| No thread selected | “Select a conversation” |
| Thread, no messages | “Start the conversation” |
| No inbox membership | Request access panel (not EmptyState) |

---

## Thread header actions (conversation pane)

- Inline **display name** edit (click to edit border mode)
- **Mark done / Reopen deal**
- **Contact** button → side panel (desktop column / mobile sheet)
- **Voice** controls on 1:1 threads (`thread-voice-call-controls`)
- Overflow menu: mark read/unread, remove from inbox (confirm → Done)
- Group threads: subtitle explains app_group vs group_mms

---

## Jump to latest / inbound toast

- **Jump to latest:** FAB when scrolled up and new messages below
- **In-app toast:** Sonner card when inbound on another thread while tab focused

---

## Composer keyboard

| Key | Action |
|-----|--------|
| Shift+Enter | Send |
| Enter | New line |

See [keyboard-shortcuts-and-events.md](../reference/keyboard-shortcuts-and-events.md).

---

## Key files

| File | Role |
|------|------|
| `inbox-messenger.tsx` | Main inbox UI |
| `conversation-side-panel.tsx` | Right panel |
| `message-status-icon.tsx` | Delivery UI |
| `outbound-contact-recipient-picker.tsx` | New thread recipient |
| `lib/messaging/send-direct-1to1-via-conversations.ts` | Send implementation |
| `lib/messaging/thread-reads.ts` | Read/unread helpers |
| `lib/messaging/thread-archive.ts` | Done/reopen |

---

## Related documents

- [03-group-messaging.md](./03-group-messaging.md)
- [06-search-snippets-side-panel.md](./06-search-snippets-side-panel.md)
- [07-notifications-realtime-polling.md](./07-notifications-realtime-polling.md)
