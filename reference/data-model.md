# Data model

Supabase Postgres schema used by TAV Communication. Core migrations live in `supabase/migrations/` (local-only, not published to Git). Tracked mirrors for newer features are in `tools/sql/`.

**Database:** Supabase project `wiacdfruipunzfffgyfy` · database name `postgres`

---

## Entity relationship overview

```
profiles ──┬── inbox_members ── inboxes ── threads ── messages ── message_attachments
             │                      │           │
             │                      │           └── thread_participants (groups)
             │                      │           └── thread_reads (per user)
             │                      │           └── thread_custom_properties
             │                      └── inbox_field_definitions ── thread_field_values
             │
             ├── profile_inbox_requests (onboarding)
             ├── contacts ── contact_bundle_members ── contact_bundles
             ├── call_logs
             ├── internal_conversation_members ── internal_conversations ── internal_messages
             │                                                              └── internal_message_attachments
             │                                                              └── internal_message_reactions
             └── bug_reports

inbox_call_assignments (inbox + user → voice ring targets)
message_snippets (inbox-scoped + personal)
message_fanout_deliveries (app_group per-recipient status; service role only)
```

---

## Core tables

### `profiles`

Extends Supabase Auth users.

| Column (representative) | Purpose |
|-------------------------|---------|
| `id` | UUID, matches `auth.users.id` |
| `email` | From Google; read-only in profile UI |
| `display_name` | User-editable |
| `phone_e164` | User mobile; used for teammate SMS and voice |
| `avatar_storage_path` | Optional profile photo path in `profile-avatars` Storage bucket |
| `role` | `admin` or `member` |
| `approval_status` | `pending`, `approved`, `rejected` |
| `onboarding_submitted_at` | When access request form submitted |
| `approved_at`, `approved_by` | Operator approval audit |
| `created_at` | Join date |

**RLS:** Users update own row. Approved users can read other approved profiles (directory).

### `inboxes`

Twilio-backed SMS lines.

| Column (representative) | Purpose |
|-------------------------|---------|
| `id` | UUID |
| `slug` | Stable key (e.g. `transportation-qa`) |
| `display_name` | UI label |
| `twilio_phone_e164` | Outbound/inbound number; null = history-only inbox |
| `sort_order` | Default rail ordering |

**RLS:** Select for approved users who are inbox members (operators bypass at app layer for writes).

### `inbox_members`

| Column | Purpose |
|--------|---------|
| `inbox_id`, `user_id` | Composite membership |
| `can_send` | Whether user may send SMS (always true when operator assigns) |

**RLS:** Scoped to own memberships + inbox access helpers.

### `threads`

One conversation per inbox context (1:1 or group).

| Column | Purpose |
|--------|---------|
| `id` | UUID |
| `inbox_id` | Parent inbox |
| `thread_kind` | `direct`, `app_group`, or `group_mms` |
| `customer_e164` | Primary external number (1:1) or nullable for groups |
| `display_name` | Override label in thread list |
| `contact_id` | FK to `contacts` when linked |
| `twilio_conversation_sid` | Twilio Conversations SID (IS service child) |
| `group_participant_snapshot` | JSON array `{ e164, label }` for group avatars |
| `last_message_*` | Denormalized preview fields |
| `archived_at`, `archived_by` | “Done Deals” state (team-wide) |
| `notes` | Thread-level notes (side panel) |

**RLS:** Approved + inbox member.

### `thread_participants`

Group thread members (external E.164 + per-participant Twilio conversation SID for app_group fan-out).

### `messages`

| Column | Purpose |
|--------|---------|
| `id` | UUID |
| `thread_id` | Parent thread |
| `direction` | `inbound` or `outbound` |
| `body` | Text (may be empty for MMS-only) |
| `status` | `queued`, `sent`, `delivered`, `failed`, `undelivered`, etc. |
| `sent_by` | Profile UUID for outbound by teammate |
| `sender_e164` | External sender on inbound |
| `twilio_message_sid` | Classic SMS SID (SM…) |
| `twilio_channel_message_sid` | Conversations message SID (IM…) |
| `source` | e.g. `twilio_conversations_webhook`, `twilio_webhook`, `ui` |
| `raw_payload` | Twilio error codes, webhook metadata |

**RLS:** Via thread → inbox membership.

### `message_attachments`

| Column | Purpose |
|--------|---------|
| `message_id` | Parent message |
| `content_type`, `filename`, `byte_size` | Metadata |
| `twilio_media_sid` | MCS media (ME…) |
| `storage_path` | Supabase Storage path (some outbound paths) |
| `external_url` | Classic webhook MediaUrl |

**Access:** `GET /api/messages/attachments/[id]/url` → RLS check → redirect to signed URL.

### `message_fanout_deliveries`

Per-recipient delivery status for **app_group** sends. **Service role only** — no client RLS policies.

### `thread_reads`

Per-user read pointer: `(user_id, thread_id, read_at)`.

Powers unread state independently per teammate. “Mark unread” only works if user had previously read the thread.

### `contacts`

Org-wide directory.

| Column | Purpose |
|--------|---------|
| `phone_e164` | Primary key for matching |
| `display_name`, `notes`, `tags` | CRM fields |
| `source` | e.g. manual, thread, import |

**RLS:** Approved users — org-wide CRUD (not inbox-scoped).

### `contact_bundles` / `contact_bundle_members`

Saved contact groups (“bundles”). Org-wide for approved users.

### `message_snippets`

Quick-insert templates. Scoped by `inbox_id`, global legacy rows, or `is_personal` per user.

### `thread_custom_properties`

Legacy “deal properties” (VIN, etc.) — slugged rows edited via `/api/threads/[id]/thread-properties`. Shown in **conversation side panel**.

### `inbox_field_definitions` / `thread_field_values`

Newer custom fields schema. CRUD via API; used by Zapier. **Not rendered in inbox UI** on `master`.

### `profile_inbox_requests`

Onboarding checkbox selections (requested inbox slugs before approval).

### `bug_reports`

User-submitted bug reports with optional attachments (private Storage bucket).

### `bug_report_attachments`

Links bug reports to files in private Storage. Uploaded after POST creates parent row.

---

## Voice tables

### `call_logs`

| Column | Purpose |
|--------|---------|
| `direction` | `inbound` / `outbound` |
| `inbox_id`, `thread_id`, `customer_e164` | Context |
| `agent_user_id` | Answering teammate |
| `twilio_call_sid` | Unique Twilio call SID |
| `status` | `ringing`, `in-progress`, `completed`, `missed`, `failed`, `busy`, `no-answer` |
| `started_at`, `ended_at`, `duration_seconds` | Timing |

**Writes:** Service role from Twilio webhooks and voice API.  
**Reads:** RLS — approved + inbox member.

### `inbox_call_assignments`

Users who receive inbound browser rings for an inbox. Non-exclusive. Managed from dev console **Call routing** tab (Transportation QA pilot).

---

## Internal chat tables

### `internal_conversations`

| Column | Purpose |
|--------|---------|
| `kind` | `dm` or `group` |
| `title` | Group name (nullable for DMs) |
| `dm_pair_key` | Unique key for DM pair (ordered user IDs) |
| `last_message_at`, `last_message_body` | List preview |

### `internal_conversation_members`

Membership + `last_read_at` per user.

### `internal_messages`

Plain text body (1–8000 chars), soft-delete via `deleted_at`, optional `edited_at`.

Extended features (attachments, reactions, reply-to, voice notes) added in later migrations — see `tools/sql/20260612150000_*`, `20260612160000_*`.

### `internal_message_attachments`

Supabase Storage-backed files for chat.

### `internal_message_reactions`

Emoji reactions per message per user.

**RLS (current on master):** Approved users + conversation membership. Operator-only gate removed via `20260615120000_internal_chat_org_wide_access.sql`.

---

## RPCs and search functions

| RPC | Purpose |
|-----|---------|
| `submit_onboarding_application` | Atomic onboarding submit |
| `upsert_direct_thread` | Create/resolve 1:1 thread |
| `upsert_group_mms_thread` | Create/resolve native group MMS thread |
| `search_thread_ids_for_workspace` | Global thread search |
| `search_messages_for_workspace` | Message body search |
| `search_contacts_for_directory` | Contact search |
| `list_contacts_directory_page` | Keyset-paginated contact browse |
| `query_contacts_directory` | Client search/filter |

Defined in `tools/sql/20260603120000_workspace_search_rpc.sql` and core migrations.

---

## Realtime publication

Postgres changes published to Supabase Realtime for:

- `threads`, `messages` (inbox)
- `contacts` (directory live updates)
- `internal_conversations`, `internal_conversation_members`, `internal_messages` (chat)

Client must call `syncRealtimeAuth()` so RLS applies to subscriptions.

---

## RLS patterns summary

| Data domain | Select rule |
|-------------|-------------|
| Messaging | Approved + inbox member |
| Contacts/bundles | Approved (org-wide) |
| Profiles | Own row + approved directory read |
| Internal chat | Approved + conversation member |
| Call logs | Approved + inbox member |
| Fanout deliveries | Service role only |

**Server writes:** Many outbound paths use **service role** after explicit app-layer checks (`getApprovedApiUser`, `userCanSendInbox`).

---

## Thread kinds

| `thread_kind` | Description |
|---------------|-------------|
| `direct` | 1:1 SMS with one external E.164 |
| `app_group` | Simulated group — separate Twilio Conversation per participant (fan-out) |
| `group_mms` | Native carrier group MMS — one Twilio Conversation, +1 NANP only, max 9 external |

See [03-group-messaging.md](../flows/03-group-messaging.md).

---

## Edge cases (data layer)

| Scenario | Data behavior |
|----------|---------------|
| Duplicate Twilio webhook | Unique constraint on message SID → no-op 200 |
| Same phone in 1:1 + group | Inbound routes to most recently active thread |
| Done thread gets message | `archived_at` cleared (DB trigger/logic + client optimistic update) |
| History-only inbox | `twilio_phone_e164` null — threads readable, send blocked |
| Operator without membership | App bypass; RLS may still block direct client reads unless member |

---

## Related documents

- [twilio-integration-map.md](./twilio-integration-map.md)
- [user-roles-and-permissions.md](./user-roles-and-permissions.md)
