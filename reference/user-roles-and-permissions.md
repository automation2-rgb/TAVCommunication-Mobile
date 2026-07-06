# User roles and permissions

How identity and access control work in TAV Communication. There is **no single role enum** — access is determined by several layers that combine at runtime.

---

## Identity layers

| Layer | Values | Where enforced | Purpose |
|-------|--------|----------------|---------|
| **Auth provider** | Google OAuth only | Supabase Auth | Sign-in |
| **Org domain** | `@texasautovalue.com` | `web/lib/auth/org-policy.ts`, OAuth callback, all gates | Reject non-org emails |
| **`profiles.approval_status`** | `pending`, `approved`, `rejected` | Edge proxy, RSC gates, API session | Workspace access lifecycle |
| **`profiles.role`** | `admin`, `member` (default) | DB + custom-field admin checks | Admin-only inbox field definition CRUD |
| **Dashboard operator** | 3 hardcoded emails | App code + SQL `user_is_dashboard_operator()` | Dev console, inbox bypass in service paths |
| **Inbox membership** | `inbox_members` rows | RLS + `userCanAccessInbox` / `userCanSendInbox` | Per-inbox read/send |

---

## Dashboard operator emails

Hardcoded in `web/lib/auth/org-policy.ts` (must stay in sync with SQL):

- `automation@texasautovalue.com`
- `automation2@texasautovalue.com`
- `rami@texasautovalue.com`

Operators get:

- Developer dashboard at `/inbox?dev=1`
- Legacy URL redirects: `/dev-console`, `/admin/users`, `/admin/dashboard` → `/inbox?dev=1`
- “Developer dashboard” link in user menu and sidebar
- Pending-approval badge on dev nav item
- All `/api/dev-console/*` and `/api/admin/dashboard/messages/*` routes
- **Inbox bypass:** `userCanAccessInbox` and `userCanSendInbox` return true for operator emails (even without `inbox_members` rows)

---

## Access matrix by user state

### Unauthenticated

| Can access | Cannot access |
|------------|---------------|
| `/`, `/login`, `/auth/*` | All workspace pages and most APIs |

Redirect: protected pages → `/login?next=<path>`.  
Special case: `/admin/dashboard` without session → `/login?next=/inbox?dev=1`.

### Signed in, wrong domain

- Immediately signed out
- Redirect: `/login?error=domain`

### Pending — onboarding not submitted

`profiles.onboarding_submitted_at` is null.

| Allowed | Blocked |
|---------|---------|
| `/onboarding` | All other pages → redirect to `/onboarding` |
| `POST /api/onboarding/apply` | |
| `GET /api/onboarding/inboxes` | |

### Pending — form submitted, awaiting approval

| Allowed | Blocked |
|---------|---------|
| `/pending-approval` | All other pages → redirect to `/pending-approval` |
| Same onboarding APIs as above | |

### Rejected

| Allowed | Blocked |
|---------|---------|
| `/account-rejected` | Everything else → `/account-rejected` |

### Approved (standard workspace user)

**Pages** (via `requireApprovedMessagingUser()` in workspace layout):

- `/inbox`, `/contacts`, `/profile`, `/settings`, `/help`, `/team/[userId]`
- `/calls`, `/chat` — **all approved users** (not operator-gated on `master`)

**APIs** (`getApprovedApiUser()`):

- Messaging: send, threads, search, attachments
- Voice: token, outbound, answered, missed-count
- Chat: all `/api/chat/*`
- Inbox access catalog/request, bug reports

**Data (RLS + app checks):**

- **Messaging:** approved + member of thread’s inbox via `inbox_members`
- **Contacts / bundles:** org-wide for all approved users
- **Internal chat:** approved + conversation membership
- **Profiles:** approved users can read other approved profiles (directory)
- **Call logs:** approved + inbox member for that call’s inbox

**Without inbox membership:**

- Inbox UI shows empty state + `RequestInboxAccessPanel`
- Can browse catalog via `GET /api/inbox-access/catalog`
- Can request access via `POST /api/inbox-access/request`
- Cannot send messages in that inbox

### Approved + `profiles.role = admin`

Everything standard approved users get, plus:

- Create/update/delete **inbox custom field definitions** (`/api/inboxes/[inboxId]/custom-field-definitions`)
- Read custom field values: admin **or** inbox member **or** dashboard operator

Note: approval flow does **not** set `role` in web code — it appears to be DB/default/operator-managed.

### Dashboard operator (approved + operator email)

Everything approved users get, plus dev console surfaces listed above.

**Important:** `/calls` and `/chat` are **not** operator-only on `master` — only the dev console UI and operator APIs are restricted.

---

## Auth enforcement locations

| Layer | File | Scope |
|-------|------|-------|
| Page proxy | `web/proxy.ts` → `web/lib/auth/edge-proxy.ts` | Session refresh, redirects for pages |
| RSC workspace | `web/lib/auth/require-approved.ts` | Server components in `(workspace)/` |
| RSC operator | `web/lib/auth/require-dashboard-operator.ts` | `/admin/dashboard` redirect target |
| JSON APIs | `web/lib/auth/api-session.ts` | `getApprovedApiUser()`, `getDashboardOperatorApiUser()` |
| Inbox scoping | `web/lib/messaging/inbox-access.ts` | Send/read checks + operator bypass |

Public API paths (no session): Twilio webhooks, Zapier/Sheets (shared secret), cron (CRON_SECRET).

Pending-user API exceptions: `/api/onboarding/apply`, `/api/onboarding/inboxes`.

---

## Approval workflow (operator actions)

1. User signs in with Google → profile exists with `approval_status = pending` (typical new user)
2. User completes `/onboarding` → RPC `submit_onboarding_application` sets name, phone, requested inboxes (`profile_inbox_requests`), `onboarding_submitted_at`
3. User waits on `/pending-approval`
4. Operator opens `/inbox?dev=1` → **Users** tab → `UserApprovalsTable`
5. Operator **Approve** → `PATCH /api/dev-console/users/[userId]` `{ action: "approve" }` → `approval_status=approved`, `approved_at`, `approved_by`
6. Operator **Reject** → same with `{ action: "reject" }` → `approval_status=rejected`
7. Operator **Edit inboxes** → `PUT /api/dev-console/users/[userId]/inboxes` → replaces all `inbox_members` (always `can_send: true`)

**Critical:** Approval does **not** auto-grant inbox membership. Operators must assign inboxes separately (or user requests post-approval).

Operators **can approve even if onboarding form was never submitted** (UI note in approvals table).

---

## SQL helper functions (RLS)

| Function | Meaning |
|----------|---------|
| `user_has_approved_access()` | Current user’s `profiles.approval_status = 'approved'` |
| `user_can_access_inbox(inbox_id)` | Approved + row in `inbox_members` for that inbox |
| `user_is_dashboard_operator()` | Approved + one of three operator emails |
| `user_is_internal_conversation_member(conversation_id)` | Row in `internal_conversation_members` |

---

## Redirect rules (approved users)

When `approval_status = approved`:

- Visiting `/`, `/login`, `/onboarding`, `/pending-approval`, `/account-rejected` → redirect to `/inbox`
- Non-operator visiting `/admin/dashboard` → redirect to `/inbox`
- Non-operator visiting `/inbox?dev=1` → `dev=1` stripped, normal inbox (server redirect in inbox page)

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Auth timeout with cookies present | Edge proxy passes through (no forced logout) |
| Auth timeout in RSC | Redirect to `/login?error=timeout` |
| Operator without inbox_members | Can still send/access all inboxes via bypass |
| Pending user hits messaging API | 401/403 from `getApprovedApiUser()` |
| Wrong-domain user completes OAuth | Signed out before any workspace access |
| `profiles.role` in UI | Display-only on profile; “assigned by administrator” |

---

## Related documents

- [01-auth-and-onboarding.md](../flows/01-auth-and-onboarding.md) — step-by-step user flows
- [10-developer-admin-console.md](../flows/10-developer-admin-console.md) — operator tools
- [data-model.md](./data-model.md) — `profiles`, `inbox_members` tables
