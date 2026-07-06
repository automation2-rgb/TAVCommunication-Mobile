# Group messaging

How group SMS threads work — **app_group** (simulated) vs **group_mms** (native carrier group MMS).

---

## Thread kinds comparison

| | **app_group** | **group_mms** |
|--|---------------|---------------|
| **Display name** | Simulated Group | Native Group MMS |
| **Participants** | 2–20, any valid E.164 | 2–9 external, **+1 NANP only** |
| **Twilio model** | One Conversation **per participant** (fan-out) | One native Group MMS Conversation |
| **Delivery tracking** | `message_fanout_deliveries` per recipient | Single `messages` row |
| **Carrier experience** | Separate 1:1 threads to each participant | True group thread on recipient phones |
| **VoIP/virtual numbers** | Usually works | Often fails (Twilio 50407) |
| **UI avatar** | `GroupContactAvatar` (stacked) | Same |
| **Create API** | `POST /api/threads/group` | Same with `native_group_mms: true` |

**Direct 1:1** is documented in [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md).

---

## Creating a group thread

### User procedure

1. In inbox, open **Group** action (new group modal)
2. Search/select **≥2 recipients** from contacts or enter phones
3. Choose mode:
   - **Native Group MMS** — toggle on for `group_mms`
   - Toggle off for `app_group` (simulated)
4. Confirm create
5. `POST /api/threads/group` with inbox ID, participant E.164s, kind flag
6. New thread opens in conversation pane

### API request shape (conceptual)

```json
{
  "inbox_id": "<uuid>",
  "participant_e164s": ["+1...", "+1..."],
  "native_group_mms": true
}
```

### Server effects

- Creates `threads` row with `thread_kind = app_group | group_mms`
- Creates `thread_participants` rows
- Provisions Twilio Conversation(s):
  - **group_mms:** single conversation with all SMS participants
  - **app_group:** one conversation per external participant
- Sets `group_participant_snapshot` JSON for avatars

---

## Group conversation UI

### Thread list

- Group avatar (stacked initials/photos from snapshot)
- Title from `display_name` or participant labels
- Snippet same as direct threads (with outbound sender prefix)

### Conversation header

- Group title (editable via side panel / thread PATCH)
- Participant count
- No voice call button (voice is 1:1 only on master)

### Message bubbles

Same layout as direct — all participants see same thread history in app.

For **app_group**, each outbound message may have per-recipient delivery status internally; UI shows aggregate status on single bubble.

---

## Sending in a group thread

### User procedure

1. Select group thread
2. Compose text and/or attachments
3. Send

### API

`POST /api/messages/send` with `{ inbox_id, thread_id, body }` — no `to` field (participants from thread).

### Server routing

```
executeOutboundToExistingGroupThread()
  group_mms → single sendConversationSmsMessage to native conversation
  app_group → loop participants, send to each conversation SID
           → insert message_fanout_deliveries rows
```

### Partial failure (app_group)

Some recipients may succeed while others fail. API returns error with `error_hint` from `hintForGroupSendFailure()`:

- **50407** — participant not SMS-capable (often VoIP)
- **50435** — group size / binding issues

UI should surface hint text; retry may duplicate sends to already-successful recipients — handle carefully.

---

## Inbound to group threads

**Webhook:** `POST /api/twilio/conversations` (`onMessageAdded`)

1. Match thread by `twilio_conversation_sid` or participant binding
2. If no thread: `upsert_group_mms_thread` or resolve via participant phone
3. Insert inbound message; update thread preview columns
4. Upsert contact for sender

**Routing conflict:** If sender’s phone exists in both a 1:1 and group thread, **`resolveInboundThreadForCustomer`** picks the **most recently active** thread.

---

## Group side panel

`ConversationSidePanel` for groups shows:

- Display name (editable)
- Thread notes
- Thread properties (VIN, etc.)
- **Participant list** — E.164 labels from snapshot + participants table
- Link to contacts directory

No directory contact notes (1:1 only feature).

---

## Group management limitations (inbox SMS groups)

Unlike internal chat, **inbox SMS groups** on master:

- Participants fixed at create time (no add/remove UI in inbox for SMS groups)
- Cannot rename via dedicated group modal after create — use side panel display name PATCH

Internal chat group management (add/leave/rename) is separate — see [09-internal-chat.md](./09-internal-chat.md).

---

## When to use which mode

| Use app_group when | Use group_mms when |
|--------------------|-------------------|
| International numbers | All participants US/Canada +1 |
| Need >9 external participants | Want true carrier group MMS |
| VoIP/virtual numbers in group | All numbers are mobile-capable |
| Simulated group acceptable | Native group text thread required |

Help text and API hints guide users away from native MMS when numbers are incompatible.

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Native MMS with VoIP participant | Twilio 50407; error hint suggests app_group |
| Fan-out partial send | Some deliveries in `message_fanout_deliveries` failed |
| Retry after partial | Risk of duplicate to successful recipients |
| Multi-image MMS | Each image = separate message row (same as direct) |
| Done group thread | Same archive/reopen rules as direct |
| History-only inbox | Cannot create or send in group |
| Inbound to wrong group | Most-recent-thread routing applies |

---

## Group creation modal (UI)

See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md) — trigger **New group chat**, Native MMS checkbox, bundle pills, recipient picker.

---

## Key files

| File | Role |
|------|------|
| `web/app/api/threads/group/route.ts` | Create group |
| `web/lib/messaging/send-group-thread-outbound.ts` | Outbound routing |
| `web/lib/messaging/group-thread-find.ts` | Thread resolution |
| `web/lib/messaging/thread-row.ts` | Parse group kinds |
| `web/components/group-contact-avatar.tsx` | Avatar UI |

---

## Related documents

- [twilio-integration-map.md](../reference/twilio-integration-map.md)
- [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md)
