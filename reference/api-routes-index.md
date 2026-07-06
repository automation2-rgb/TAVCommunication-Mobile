# API routes index

All Next.js Route Handlers under `web/app/api/`. Auth column indicates minimum requirement.

**Legend:**  
- **Public** — no session (secret or Twilio signature instead)  
- **Approved** — `getApprovedApiUser()`  
- **Operator** — `getDashboardOperatorApiUser()`  
- **Pending** — allowed for pending onboarding users

---

## Auth and onboarding

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/onboarding/apply` | Pending + session | Submit onboarding RPC |
| GET | `/api/onboarding/inboxes` | Pending + session | List inbox catalog for form |

OAuth callback is `GET /auth/callback` (page route, not under `/api`).

---

## Messaging and threads

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/messages/send` | Approved + inbox send | Outbound SMS/MMS (JSON or multipart) |
| GET | `/api/messages/attachments/[attachmentId]/url` | Approved + RLS | Redirect to media URL |
| POST | `/api/threads/group` | Approved | Create app_group or group_mms thread |
| GET/PATCH | `/api/threads/[threadId]` | Approved | Thread notes, display name |
| POST/DELETE | `/api/threads/[threadId]/hide` | Approved | Mark Done / reopen |
| GET/PATCH/POST | `/api/threads/[threadId]/thread-properties` | Approved | Legacy deal properties |
| GET/PATCH | `/api/threads/[threadId]/custom-fields` | Approved | New custom fields (API only) |
| GET/POST | `/api/inboxes/[inboxId]/custom-field-definitions` | Approved (admin for mutations) | Field schema CRUD |
| GET/PATCH/DELETE | `/api/inboxes/[inboxId]/custom-field-definitions/[fieldId]` | Approved (admin) | Single field definition |
| GET | `/api/search` | Approved | Workspace search (min 3 chars) |

---

## Inbox access

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/inbox-access/catalog` | Approved | List inboxes user can request |
| POST | `/api/inbox-access/request` | Approved | Submit inbox access request |

---

## Twilio webhooks (public — signature auth)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/twilio/conversations` | Conversations events (inbound, delivery) |
| POST | `/api/twilio/inbound` | Classic SMS inbound |
| POST | `/api/twilio/status` | Message delivery status |
| POST | `/api/twilio/voice/inbound` | Inbound call TwiML |
| POST | `/api/twilio/voice/inbound-dial-complete` | Dial completion |
| POST | `/api/twilio/voice/outbound-twiml` | Outbound browser call TwiML |
| POST | `/api/twilio/voice/status` | Call status → call_logs |

---

## Voice (client)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/api/voice/token` | Approved | Twilio Voice access token |
| POST | `/api/voice/outbound` | Approved + inbox send | Validate outbound call |
| POST | `/api/voice/answered` | Approved | Tag agent on answered call |

---

## Internal chat

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/api/chat/conversations` | Approved | List / create DM or group |
| PATCH | `/api/chat/conversations/[id]` | Approved + member | Rename group |
| GET/POST | `/api/chat/conversations/[id]/messages` | Approved + member | List / send messages |
| PATCH | `/api/chat/conversations/[id]/read` | Approved + member | Mark read |
| POST | `/api/chat/conversations/[id]/members` | Approved + member | Add group members |
| DELETE | `/api/chat/conversations/[id]/members/me` | Approved + member | Leave group |
| POST | `/api/chat/messages/[messageId]/reactions` | Approved + member | Toggle reaction |
| GET | `/api/chat/attachments/[id]/url` | Approved + member | Signed attachment URL |

---

## Developer console (operator)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dev-console/users` | Operator | All profiles + inbox requests |
| PATCH | `/api/dev-console/users/[userId]` | Operator | Approve / reject user |
| GET/PUT | `/api/dev-console/users/[userId]/inboxes` | Operator | Replace inbox memberships |
| GET | `/api/dev-console/pending-counts` | Operator | Pending approval count |
| GET/PUT | `/api/dev-console/voice-pilot/call-assignments` | Operator | Ring assignment grid |
| GET | `/api/admin/dashboard/messages/lookup` | Operator | Message search |
| GET/PATCH | `/api/admin/dashboard/messages/[messageId]` | Operator | Detail, triage, ack, status |
| GET | `/api/admin/dashboard/messages/twilio-diag` | Operator | Twilio Conversations diagnostic |

---

## Developer console (approved — not operator-only)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/dev-console/voice-pilot/missed-count` | Approved | Missed call nav badge |

---

## Integrations (public — shared secret)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/integrations/zapier/messages` | `ZAPIER_INTEGRATION_SECRET` | Automation send |
| POST | `/api/integrations/zapier/contacts` | Zapier secret | Contact upsert |
| POST | `/api/integrations/google-sheets/contacts` | Sheets/Zapier secret | Bulk contact import |

Secret verification: `web/lib/integrations/zapier-secret.ts` (timing-safe compare).

---

## Cron (public — CRON_SECRET)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/cron/sync-twilio-history` | `CRON_SECRET` | Twilio history backfill |

---

## Bug reports

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/bug-reports` | Approved | Submit bug report |

---

## Routes with no REST handler (direct Supabase client)

These workspace features use browser Supabase client + RLS instead of dedicated API routes:

- **Contacts directory** — CRUD, bundles, RPC search
- **Profile** — update `display_name`, `phone_e164`
- **Message snippets** — CRUD via client
- **Settings** — localStorage preferences only
- **Bug reports tab in dev console** — client read of `bug_reports`

---

## Common API error patterns

| Status | Typical cause |
|--------|---------------|
| 401 | No session |
| 403 | Wrong domain, not approved, not inbox member, not operator |
| 404 | Thread/message/user not found or no access |
| 400 | Validation (E.164, UUID, empty body, self-DM) |
| 500 | Twilio misconfig, service role missing, RPC failure |

---

## Related documents

- [user-roles-and-permissions.md](./user-roles-and-permissions.md)
- [twilio-integration-map.md](./twilio-integration-map.md)
