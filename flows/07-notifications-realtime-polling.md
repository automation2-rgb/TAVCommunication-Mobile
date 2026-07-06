# Notifications, Realtime, and polling

How the app stays up to date and alerts users to new inbound SMS.

---

## Notification layers

| Layer | When | Mechanism |
|-------|------|-----------|
| **In-app toast** | Tab focused, inbound on non-open thread | DOM toast + optional sound |
| **OS notification** | Tab backgrounded / no focus | Service worker + Notification API |
| **Sound** | User enabled in settings | `/notification.mp3` |
| **Favicon badge** | Any unread across inboxes | `applyUnreadBadgeToFavicon` |
| **Sidebar badges** | Per-inbox unread, chat, calls, dev pending | Poll + Realtime-driven state |

---

## Desktop notification setup

### User procedure (Settings)

1. Go to `/settings`
2. Enable **Desktop notifications** toggle
3. Click **Enable notifications** → browser permission prompt
4. Grant permission

### Permission states

| State | UI behavior |
|-------|-------------|
| `granted` | OS notifications enabled when backgrounded |
| `denied` | Show instructions to reset in browser settings |
| `default` | Prompt available |

Stored preference: `localStorage` via `readDesktopNotificationsEnabled()`.

---

## Inbound alert dispatch

**Module:** `lib/messaging/inbound-notification.ts`

### Decision tree

```
Inbound message detected (Realtime or poll)
  → Build dedupe key (messageId or threadId+timestamp)
  → Already seen? skip
  → Tab backgrounded?
       yes → Service worker notification (if permitted)
       no  → In-app toast (unless suppressed)
  → Sound enabled? playInboundAlertSound()
```

### Dedupe

Keys like `m:<messageId>` or `t:<threadId>:@<lastMessageAt>` — max 400 keys in memory set.

### Service worker

- File: `web/public/inbox-alerts-sw.js`
- Registered via `registerInboxAlertsServiceWorker()`
- Shows notification with contact name, inbox name, snippet
- Click navigates to thread (via client message handler)

### Sound deferral

If autoplay blocked, sound marked deferred and flushed on next user gesture (`inbound-message-ping.ts`).

---

## Supabase Realtime (inbox)

### Thread channel

- Name: `realtime:threads:{inbox-ids}` — all accessible inbox UUIDs in one channel
- Events: `threads` INSERT/UPDATE/DELETE
- Batching: 48ms merge window before UI update

**Effects:**

- Thread list reorder on new message
- Preview snippet updates
- Archive/reopen reflects immediately
- Unread badge recalculation

### Message channel

- Name: `realtime:messages:{threadId}` — open thread only
- Events: `messages` INSERT/UPDATE
- Batching: requestAnimationFrame merge

**Effects:**

- New bubbles in open conversation
- Status icon updates (delivered/failed)

### Attachment lag

Attachment INSERT triggers debounced silent reload (700ms) — nested embed may lag Realtime payload.

### Auth requirement

`syncRealtimeAuth()` must set JWT on Realtime client. Without it, subscriptions silently fail until page reload.

---

## Polling (fallback)

When Realtime unavailable or as safety net:

| Context | Interval | Scope |
|---------|----------|-------|
| Tab visible | 60 seconds | Selected inbox threads + open thread messages |
| Tab background | 30 seconds | Same + scan for missed inbound |

Also used to recover from missed Realtime events when backgrounded.

---

## Prefetch

- Top **8** threads (by recency) idle-prefetch messages into `messagesCacheRef`
- Hover/focus on thread row triggers prefetch
- Reduces perceived load time on thread switch

---

## Favicon unread badge

`lib/favicon-unread-badge.ts`:

- Draws count on favicon when total unread > 0
- Clears when all threads read
- Driven by aggregated unread across inboxes

---

## Chat attention polling

`ChatAttentionProvider`:

- Polls `GET /api/chat/conversations` on interval
- Sums unread flags → chat nav badge

---

## Dev console attention polling

`DevConsoleAttentionProvider`:

| Metric | API | Nav badge |
|--------|-----|-----------|
| Pending approvals | `GET /api/dev-console/pending-counts` | Dev dashboard (operators) |
| Missed calls | `GET /api/dev-console/voice-pilot/missed-count?since=…` | Calls (all approved) |

Missed call `since` = `localStorage` `tav-voice:calls-last-seen-at` (updated visiting `/calls`).

---

## Internal chat Realtime

Separate from inbox:

- Channel on `internal_messages` for selected conversation
- Conversation list updates via polling (no dedicated unread API)

See [09-internal-chat.md](./09-internal-chat.md).

---

## Event-driven optimizations

Shipped on master (from planning docs):

- Debounced mark-read writes
- Event-driven polling (not aggressive constant refresh)
- Search uses indexed RPCs (not full table scan)

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Notifications denied | Still get in-app toast when focused |
| Sound off | No audio regardless of focus |
| Duplicate Realtime event | Dedupe key prevents double notification |
| Realtime disconnect | Polling catches up within 30–60s |
| SW not registered | Falls back to in-tab Notification if permitted |
| Multiple inboxes | Single thread channel per open thread; multi-inbox thread channel |
| Long-lived tab | Periodic `syncRealtimeAuth` on chat; inbox syncs on activity |

---

## Key files

| File | Role |
|------|------|
| `inbound-notification.ts` | Alert dispatch |
| `inbox-alerts-sw.js` | Service worker |
| `inbox-alerts-sw-client.ts` | SW registration |
| `inbound-message-ping.ts` | Sound playback |
| `favicon-unread-badge.ts` | Favicon |
| `inbox-messenger.tsx` | Realtime subscriptions |
| `dev-console-attention-context.tsx` | Badge polling |
| `chat-attention-context.tsx` | Chat badge |

---

## Related documents

- [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md)
- [05-team-profile-settings-help.md](./05-team-profile-settings-help.md)
- [08-voice-calls.md](./08-voice-calls.md)
