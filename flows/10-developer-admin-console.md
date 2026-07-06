# Developer and admin console

Operator-only tools for user management, message triage, voice routing, and bug review. Embedded in inbox — not a separate app shell.

**Entry URL:** `/inbox?dev=1`  
**Access:** Dashboard operators only (`automation@`, `automation2@`, `rami@` @texasautovalue.com)

Legacy URLs redirect here: `/dev-console`, `/admin/users`, `/admin/dashboard` → `/inbox?dev=1`

---

## Entry procedure

1. Operator signs in as approved user
2. Clicks **Developer dashboard** in sidebar or user menu
3. Navigates to `/inbox?dev=1`
4. Server verifies `isDashboardOperator` — non-operators redirected to `/inbox` (silent, no error page)
5. Inbox messenger swaps thread list for dev embed

### Exit dev mode

- Click **Messages** back control in dev embed
- Drops `dev=1` from URL → normal inbox messaging restored

---

## Dev mode UI layout

```
┌─────────────────────────────────────────────────────────────┐
│ Dev embed header + tab bar                                  │
├─────────────────────────────────────────────────────────────┤
│ Tab content (tables, forms, panels)                         │
│                                                             │
│ Optional: Message detail side panel / mobile sheet          │
└─────────────────────────────────────────────────────────────┘
```

**Components:**

- `developer-dashboard-inbox-embed.tsx` — wrapper
- `messaging-panels.tsx` — tab bar + routing
- `messaging-health-panels.tsx` — overview/attention/reviewed

**Important:** Dev mode **skips thread/message SSR** — empty thread lists; normal messaging disabled until exit.

---

## Tabs overview

| Tab | Purpose |
|-----|---------|
| **Overview** | 24h outbound status counts; recent inbound/outbound tables |
| **Needs attention** | Failed + stuck queued outbound messages |
| **Reviewed** | Operator-triaged messages |
| **Lookup** | Search/filter messages (service role) |
| **Users** | Approve/reject users; assign inboxes |
| **Calls** | Transportation QA inbound ring assignments |
| **Bugs** | Submitted bug reports |

---

## Overview tab

**Data:** `fetchDashboardMessaging` snapshot (service role) loaded in inbox page SSR, passed to client.

**Displays:**

- Outbound counts by status (last 24 hours)
- Recent inbound message table
- Recent outbound message table

**Row click:** Opens message detail panel.

---

## Needs attention tab

Lists outbound messages that are:

- **Failed** or **undelivered**
- **Queued** stuck beyond threshold

Operators investigate Twilio errors, retry from customer side, or triage in detail panel.

---

## Reviewed tab

Messages operators marked as reviewed/triaged — workflow for clearing attention queue.

---

## Lookup tab

### Procedure

1. Enter filters (phone, inbox, date range, status, body snippet, etc.)
2. Submit → `GET /api/admin/dashboard/messages/lookup`
3. Results table with pagination
4. Row click → message detail

**Auth:** Operator only; uses service role for cross-inbox search.

---

## Users tab

**Component:** `user-approvals-table.tsx`

### User list

`GET /api/dev-console/users` — all profiles with:

- Email, display name, phone
- Requested inboxes (from onboarding)
- Role, approval_status, joined date

### Approve user

1. Click **Approve** on pending row
2. `PATCH /api/dev-console/users/[userId]` `{ action: "approve" }`
3. Sets `approval_status=approved`, `approved_at`, `approved_by`

### Reject user

Same PATCH with `{ action: "reject" }` → `approval_status=rejected`

### Edit inboxes

1. Click **Edit inboxes** → `UserInboxAssignmentsModal`
2. `GET /api/dev-console/users/[userId]/inboxes` — current memberships
3. Toggle inboxes
4. `PUT` replaces **all** memberships (`can_send: true` always)

**UI note:** Operators can approve even if onboarding never submitted.

### Pending badge

Sidebar dev nav shows count from `GET /api/dev-console/pending-counts` (all `approval_status=pending`).

---

## Calls tab (voice routing)

**Component:** `inbox-call-assignments-panel.tsx`

### Purpose

Configure which approved **Transportation QA** inbox members receive inbound browser rings for pilot line.

### Procedure

1. Load `GET /api/dev-console/voice-pilot/call-assignments`
2. Checkbox grid of eligible members
3. Save → `PUT /api/dev-console/voice-pilot/call-assignments`
4. Server replaces `inbox_call_assignments` rows for pilot inbox

### Validation

- Users must be approved members of Transportation QA inbox
- Pilot inbox must exist with expected phone `+17435000019`

---

## Bugs tab

- Reads `bug_reports` via **user Supabase client** (RLS), not operator service API
- Lists user-submitted bugs from global bug report modal
- Shows description, reporter, timestamps, attachment indicators

---

## Message detail panel

Opened from Overview, Attention, Reviewed, or Lookup rows.

**Desktop:** Side panel  
**Mobile:** Bottom sheet

**Component:** `message-detail-modal.tsx` / panel variant

### Data

`GET /api/admin/dashboard/messages/[messageId]` — full message + thread + Twilio metadata

### Actions (PATCH)

| Action | Effect |
|--------|--------|
| Triage / ack flags | Operator workflow fields |
| Local status override | Only when no `twilio_message_sid` (`canSetStatusLocally`) |

### Twilio diagnostic

`GET /api/admin/dashboard/messages/twilio-diag?conversationSid=…` or `dbMessageId=…`

Shows Conversations API state for debugging delivery issues.

---

## Admin dashboard page (legacy)

`/admin/dashboard` → server redirect to `/inbox?dev=1`

Uses `requireDashboardOperator()` before redirect.

---

## Operator API summary

| Endpoint | Methods |
|----------|---------|
| `/api/dev-console/users` | GET |
| `/api/dev-console/users/[userId]` | PATCH |
| `/api/dev-console/users/[userId]/inboxes` | GET, PUT |
| `/api/dev-console/pending-counts` | GET |
| `/api/dev-console/voice-pilot/call-assignments` | GET, PUT |
| `/api/admin/dashboard/messages/lookup` | GET |
| `/api/admin/dashboard/messages/[messageId]` | GET, PATCH |
| `/api/admin/dashboard/messages/twilio-diag` | GET |

---

## Operator privileges elsewhere

| Privilege | Detail |
|-----------|--------|
| Inbox bypass | Access/send all inboxes without `inbox_members` |
| Custom field admin | Same as `profiles.role=admin` for field definitions |
| Dev nav link | `showDeveloperDashboard={isDashboardOperator}` in shell |

---

| Tab | UI label |
|-----|----------|
| Overview | Overview |
| Needs attention | Needs attention |
| Reviewed | Reviewed |
| Lookup | Lookup |
| Users | **User approvals** |
| Calls | **Call routing** |
| Bugs | **Bug reports** |

---

## Panel-level UI detail

| Panel | UI behaviors |
|-------|--------------|
| **Overview** | 24h outbound status **count cards**; recent inbound (25) + outbound (35) tables |
| **Needs attention** | Failed/undelivered + stuck queued (>15m, unreviewed) |
| **Reviewed** | Table with Reviewed + Category columns |
| **Lookup** | Filter grid: messageId, direction, status, inbox slug, ack, body, SID, phone, ISO dates, limit |
| **User approvals** | Wide table; Approve / Reject / **Inboxes** modal (`UserInboxAssignmentsModal`) |
| **Call routing** | Transportation QA member checkbox grid |
| **Bug reports** | Table: when, user, body, attachment links, page URL, user agent |

**Message detail:** Desktop right column; mobile sheet. Triage, ack, local status, Twilio diag, raw payload.

**Embed shell:** “Messages” back exits `dev=1`.

See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Non-operator bookmark `?dev=1` | Redirect to normal inbox |
| Approve without inbox assign | User sees empty inbox + access request |
| Inbox PUT | Replaces entire membership set (not merge) |
| Message PATCH on Twilio message | Cannot override Twilio status locally |
| Bug tab RLS | Operator sees only what RLS allows on bug_reports |
| Service role missing | Overview/lookup may error |

---

## Key files

| File | Role |
|------|------|
| `inbox/page.tsx` | Dev mode gate + SSR data |
| `messaging-panels.tsx` | Tab container |
| `user-approvals-table.tsx` | User management |
| `inbox-call-assignments-panel.tsx` | Voice routing |
| `lib/admin/dashboard-data.ts` | Snapshot fetch |
| `lib/admin/operator-triage.ts` | Triage helpers |
| `lib/admin/message-detail-hints.ts` | Detail UI hints |

---

## Related documents

- [01-auth-and-onboarding.md](./01-auth-and-onboarding.md)
- [08-voice-calls.md](./08-voice-calls.md)
- [user-roles-and-permissions.md](../reference/user-roles-and-permissions.md)
