# Internal chat

In-app staff messaging — DMs and groups. **No Twilio**; all data in Supabase.

**Page:** `/chat`  
**Component:** `chat-messenger.tsx`  
**Access:** All approved users (org-wide since RLS migration `20260615120000`)

---

## Purpose vs inbox SMS

| | Inbox SMS | Internal chat |
|--|-----------|---------------|
| Transport | Twilio Conversations | Supabase only |
| External parties | Customers (E.164) | Staff only (profiles) |
| Tables | threads, messages | internal_conversations, internal_messages |
| Phone required | Yes | No |

---

## Page layout

```
┌──────────────────┬────────────────────────────────────┐
│ Conversation list│ Message thread                     │
│ - DMs            │ - Header (title / peer name)       │
│ - Groups         │ - Message bubbles                  │
│ - Unread badges  │ - Composer                         │
│                  │ - Group info panel (groups)        │
└──────────────────┴────────────────────────────────────┘
```

**Mobile:** Toggle between list view and thread view (back button).

---

## Load procedure

### Server

1. `requireApprovedMessagingUser()`
2. Load approved peer profiles (excluding self) via service role for picker

### Client

1. `GET /api/chat/conversations` — list with unread flags
2. Select conversation → `GET /api/chat/conversations/[id]/messages`
3. `PATCH /api/chat/conversations/[id]/read` — mark read
4. Subscribe to Realtime on `internal_messages`

---

## Start a DM

### From chat UI

1. **New conversation** modal
2. Select one approved teammate
3. `POST /api/chat/conversations` `{ peer_user_id }`
4. Server: `find-or-create-dm` using `dm_pair_key`
5. Open conversation

### From team page

1. `/team/[userId]` → **Message in app**
2. Navigate to `/chat?user=<uuid>`
3. Client waits for list load, then `startDmWithUser`
4. `deepLinkHandled` ref prevents duplicate creation

**Cannot DM self** — API 400.

---

## Create a group

1. New conversation modal → **Group** mode
2. Select multiple approved peers
3. Optional title
4. `POST /api/chat/conversations` with member IDs
5. `create-group-conversation.ts` provisions rows

---

## Send a message

### Text

1. Type in `chat-composer.tsx`
2. `POST /api/chat/conversations/[id]/messages` `{ body }`
3. Optimistic bubble → reconcile on response

### With attachments

1. Attach files via composer
2. Multipart POST to same endpoint
3. Files uploaded to Supabase Storage (`internal_message_attachments`)
4. Display via `GET /api/chat/attachments/[id]/url`

### Voice notes

- Record audio in composer (Phase 8)
- Uploaded as attachment with audio content type

### Reply to message

- Reply-to reference on message row
- UI shows quoted preview above bubble

---

## Group management

| Action | API |
|--------|-----|
| Rename group | `PATCH /api/chat/conversations/[id]` `{ title }` |
| Add members | `POST /api/chat/conversations/[id]/members` |
| Leave group | `DELETE /api/chat/conversations/[id]/members/me` |

**UI:** `chat-group-info-panel.tsx`

---

## Reactions

1. User adds emoji reaction on message bubble
2. `POST /api/chat/messages/[messageId]/reactions` toggle
3. Aggregated display via `chat-message-reactions.tsx`

---

## Read state

- Per-member `last_read_at` in `internal_conversation_members`
- Unread derived server-side in conversation list
- Mark read on conversation open (PATCH read endpoint)

**No dedicated unread-count API** — derived from list payload.

---

## Realtime

- Channel on `internal_messages` for open conversation
- New messages appear without full reload
- `syncRealtimeAuth()` on long-lived tabs

Conversation list refreshes via `ChatAttentionProvider` polling (nav badge).

---

## Message bubble UI

**Component:** `chat-message-bubble.tsx`

| Feature | Support |
|---------|---------|
| Text | Yes |
| Attachments | Thumbnails + lightbox |
| Voice notes | Playback controls |
| Reactions | Emoji row below bubble |
| Reply preview | Quoted block |
| Edit/delete | Soft-delete via `deleted_at` (sender) |

Alignment: own messages right, others left. Sender name on group messages.

---

## Attachment limits

Validated in `validateChatAttachmentFile`:

- Max size and type restrictions (images, common formats)
- Batch validation for multiple files

---

## Unread nav badge

`ChatAttentionProvider`:

- Polls conversation list
- Sums conversations with unread flag
- Shows count on **Chat** sidebar item

---

## Empty and selection states

| State | Copy |
|-------|------|
| No conversations | “No conversations yet” + start button |
| None selected | “Select a conversation or start a new message.” |

---

## UI components not covered above

| Component | Purpose |
|-----------|---------|
| `chat-new-conversation-modal.tsx` | Start DM or group |
| `chat-group-info-panel.tsx` | Rename, add members, leave |
| `chat-message-reactions.tsx` | Emoji reactions |
| `chat-composer.tsx` | Text, attachments, voice notes, reply-to |
| Attachment lightbox | Same pattern as inbox |

Mobile: list ↔ thread toggle with back chevron.

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Invalid peer UUID | 404 |
| Non-approved peer | 404 from profile load |
| Empty message | 400 unless attachment present |
| Deep link before list loads | Waits for `listLoading` false |
| Realtime auth stale | Reload needed |
| Older messages | Pagination/load-more backlog noted in planning docs |
| Group creator adds members | RLS allows creator to insert member rows |

---

## Key files

| File | Role |
|------|------|
| `chat-messenger.tsx` | Main chat UI |
| `chat-composer.tsx` | Input + attachments + voice |
| `chat-new-conversation-modal.tsx` | DM/group create |
| `lib/chat/find-or-create-dm.ts` | DM dedup |
| `lib/chat/send-message.ts` | Send logic |
| `lib/chat/membership.ts` | Access checks |

---

## Related documents

- [05-team-profile-settings-help.md](./05-team-profile-settings-help.md)
- [07-notifications-realtime-polling.md](./07-notifications-realtime-polling.md)
- [data-model.md](../reference/data-model.md)
