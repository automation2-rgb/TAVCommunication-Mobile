# Auth and onboarding

Complete procedure for how users sign in, request access, get approved, and enter the workspace.

---

## Login

### Entry points

- `/` — redirects approved users to `/inbox`; others to login flow via proxy
- `/login` — primary sign-in page
- Protected route without session → `/login?next=<encoded-path>`

### Sign-in method

**Google OAuth only** — no email/password form.

**UI:** `web/app/login/page.tsx` + `google-sign-in-button.tsx`

**Steps:**

1. User clicks “Sign in with Google”
2. Browser redirects to Google OAuth via Supabase:
   ```javascript
   supabase.auth.signInWithOAuth({
     provider: "google",
     redirectTo: origin + "/auth/callback?next=…"
   })
   ```
3. Google returns to `GET /auth/callback`
4. Server exchanges code (`exchangeCodeWithTimeout`)
5. Domain check: email must end with `@texasautovalue.com`
   - **Fail:** sign out → `/login?error=domain`
6. Redirect to `safeNextPath(next)` — default `/inbox`

### Login error codes (query param `error`)

| Code | Meaning |
|------|---------|
| `domain` | Email not on org domain |
| `auth` | OAuth exchange failed |
| `timeout` | Auth exchange timed out |

### Sign out

`SignOutButton` → `supabase.auth.signOut()` → `/login`

---

## Post-login routing (by approval status)

Handled by `web/lib/auth/edge-proxy.ts` and mirrored in `require-approved.ts`:

| Status | Condition | Destination |
|--------|-----------|-------------|
| `rejected` | — | `/account-rejected` |
| `pending` | `onboarding_submitted_at` null | `/onboarding` |
| `pending` | form submitted | `/pending-approval` |
| `approved` | hit login/onboarding/pending/rejected/`/` | `/inbox` |

---

## Onboarding (`/onboarding`)

**Who sees it:** Pending users who have not submitted the access request form.

### Form fields

| Field | Validation |
|-------|------------|
| First name | Required |
| Last name | Required |
| Phone | E.164 format |
| Inbox checkboxes | At least one; options from static list |

**Inbox options** (8 slugs — must match `public.inboxes.slug`):

1. Wires Only Only
2. Inspection Approval
3. Titles & Collections
4. Scheduling
5. Wires & Accounting
6. Transporter Scheduling
7. Inventory Control
8. Transportation QA

Source: `web/lib/onboarding/static-inbox-options.ts`

### Submit procedure

1. User completes form and submits
2. Client: `POST /api/onboarding/apply` with names, phone, selected slugs
3. Server validates org email
4. Server resolves slugs → inbox UUIDs (service role)
5. Server calls RPC `submit_onboarding_application`
6. Profile updated: name, phone, `profile_inbox_requests`, `onboarding_submitted_at`
7. User redirected to `/pending-approval`

### RPC error codes (handled in API)

`not_authenticated`, `no_profile`, `not_pending`, `already_submitted`, `name_required`, `phone_invalid`, `inboxes_required`, `invalid_inbox`, `phone_in_use`

---

## Pending approval (`/pending-approval`)

**Who sees it:** Pending users after form submission.

**UI behavior:**

- Static waiting state — explains admin review
- No workspace access until approved
- Can still call onboarding APIs if needed

**Allowed while pending:**

- Pages: `/pending-approval`, `/onboarding` (if not yet submitted)
- APIs: `/api/onboarding/apply`, `/api/onboarding/inboxes`

---

## Account rejected (`/account-rejected`)

**Who sees it:** `approval_status = rejected`

Terminal state for workspace — only this page accessible. User must contact administrator (messaging in UI).

---

## Operator approval procedure

See [10-developer-admin-console.md](./10-developer-admin-console.md) for full dev console flow.

**Summary:**

1. Operator opens `/inbox?dev=1` → **Users** tab
2. Reviews pending users (email, name, phone, requested inboxes, role, status)
3. **Approve** → user can access workspace on next navigation
4. **Edit inboxes** → assigns `inbox_members` (required for messaging)
5. **Reject** → user sent to `/account-rejected` on next request

**Note:** Operators can approve users who never submitted onboarding.

---

## First workspace entry (approved, no inboxes)

1. User lands on `/inbox`
2. `requireApprovedMessagingUser()` passes
3. Empty inbox state if no `inbox_members`
4. `RequestInboxAccessPanel` shown:
   - Lists available inboxes from `GET /api/inbox-access/catalog`
   - User submits `POST /api/inbox-access/request`
5. Operator assigns inboxes via dev console

---

## Session and security details

| Topic | Behavior |
|-------|----------|
| Open redirect protection | `safeNextPath()` sanitizes `next` param |
| API vs pages | Pages gated by proxy; APIs use `getApprovedApiUser()` independently |
| Auth timeout (edge) | Cookies present → pass through |
| Auth timeout (RSC) | Redirect `/login?error=timeout` |
| Domain re-check | On callback and every approved gate |

---

## UI details — login page

- Centered card layout on **dark** full-viewport background (`bg-zinc-950`)
- Google sign-in button (primary CTA)
- Error banner when `?error=` present
- Preserves `next` through OAuth for deep links after login

**Only `/login` uses the dark theme.** Onboarding, pending-approval, and account-rejected use the light account shell (`bg-zinc-50`, white card).

---

## Onboarding page UI (`/onboarding`)

**Shell:** Light account layout — `TavBrandLink` header, `max-w-lg` centered card.

**Validation:** Sonner toasts (not inline errors). Footer: **Submit application** + **Sign out**.

**File:** `web/app/onboarding/onboarding-application-form.tsx`

---

## Pending / rejected pages

| Page | Title | Actions |
|------|-------|---------|
| `/pending-approval` | “Application received” | Sign out only |
| `/account-rejected` | “Access not granted” | Sign out only |

---

## Sign out and user menu

- **Sign out:** `sign-out-button.tsx` → `/login`
- **User menu items:** Profile, Contacts, Settings, Help, Report a bug, Dev dashboard (operators), Calls (missed badge), Sign out

See [ui/workspace-layout-and-navigation.md](../ui/workspace-layout-and-navigation.md).

---

## Related documents

- [user-roles-and-permissions.md](../reference/user-roles-and-permissions.md)
- [10-developer-admin-console.md](./10-developer-admin-console.md)
