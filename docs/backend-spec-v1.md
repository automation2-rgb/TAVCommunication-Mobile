# Backend Spec — Mobile v1 (apply in Vercel/web repo)

Changes required on production Vercel before mobile push and Bearer-authenticated API calls work.

**Production base:** `https://tav-communication.vercel.app`

---

## 1. Bearer token auth on existing API routes

### Goal

Mobile sends `Authorization: Bearer <supabase_access_token>`. Web continues using cookies. Same authorization rules.

### Implementation rules

1. In `web/lib/auth/api-session.ts` (or equivalent), when resolving the user:
   - First try existing cookie-based Supabase session (unchanged).
   - If no cookie session, read `Authorization` header.
   - If header starts with `Bearer `, validate JWT via Supabase (`supabase.auth.getUser(token)` or `createClient` with global headers).
2. Load `profiles` row for authenticated user ID.
3. Enforce org domain (`@texasautovalue.com`) — same as OAuth callback.
4. `getApprovedApiUser()` — require `approval_status = 'approved'`.
5. Add `getPendingApiUser()` helper for onboarding routes — require `approval_status = 'pending'`.

### Routes that must accept Bearer (minimum for v1)

| Method | Path |
|--------|------|
| POST | `/api/onboarding/apply` |
| GET | `/api/onboarding/inboxes` |
| POST | `/api/messages/send` |
| GET | `/api/messages/attachments/[attachmentId]/url` |
| POST | `/api/threads/[threadId]/hide` |
| DELETE | `/api/threads/[threadId]/hide` |
| GET | `/api/inbox-access/catalog` |
| POST | `/api/inbox-access/request` |
| POST | `/api/push/register` |
| DELETE | `/api/push/register` |

All other approved-user routes should accept Bearer too (forward-compatible), but v1 mobile only calls the above + Supabase direct reads.

### Test

```bash
# Replace TOKEN with Supabase access_token from a signed-in test user
curl -H "Authorization: Bearer TOKEN" \
  https://tav-communication.vercel.app/api/inbox-access/catalog
```

Expect 200 for approved user, 401 without token, 403 for wrong domain / not approved.

---

## 2. Push device tokens table

Add migration (Supabase SQL):

```sql
create table public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index push_device_tokens_user_id_idx on public.push_device_tokens(user_id);

alter table public.push_device_tokens enable row level security;

-- Users manage own tokens via API (service role or user-scoped policies)
create policy "Users read own push tokens"
  on public.push_device_tokens for select
  using (auth.uid() = user_id);

create policy "Users insert own push tokens"
  on public.push_device_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users delete own push tokens"
  on public.push_device_tokens for delete
  using (auth.uid() = user_id);

create policy "Users update own push tokens"
  on public.push_device_tokens for update
  using (auth.uid() = user_id);
```

Push **sending** uses service role (bypass RLS) from Vercel webhook handler.

---

## 3. Push register API

### `POST /api/push/register`

**Auth:** Approved user (Bearer or cookie)

**Body:**

```json
{
  "token": "<fcm_device_token>",
  "platform": "ios" | "android"
}
```

**Behavior:**

1. Validate token non-empty, platform enum.
2. Upsert into `push_device_tokens` for `user_id = current user` (on conflict `user_id, token` update `updated_at`).
3. Return `{ ok: true }`.

### `DELETE /api/push/register`

**Auth:** Approved user

**Body (optional):**

```json
{ "token": "<fcm_device_token>" }
```

**Behavior:**

- If `token` provided, delete that row for current user.
- If omitted, delete all rows for current user (full logout cleanup).

---

## 4. Push dispatch on inbound SMS

### Trigger point

After inbound message is persisted (in Twilio Conversations webhook handler — same path that inserts `messages` row and updates `threads.last_message_*`).

**File reference (web app):** `web/lib/messaging/inbound-message-ping.ts` or conversations webhook route.

### Dispatch rules

1. Load all `push_device_tokens` for users who are **inbox members** of the message’s inbox (`inbox_members`).
2. Exclude tokens belonging to the user who sent the message if direction is outbound (N/A for inbound).
3. For inbound: notify **all** inbox members (including active app users — product decision: always fire).
4. Build notification:
   - **Title:** Inbox display name (e.g. "Transportation QA")
   - **Body:** `{sender label}: {message preview}` (truncate ~120 chars)
   - **Data payload:** `{ inbox_id, thread_id, message_id }` for deep link
5. Send via Firebase Admin SDK (FCM HTTP v1).
6. Log failures; do not block webhook response on push failure (fire-and-forget with timeout).

### Sender label logic

Mirror web thread list snippet logic:

- Prefer contact name from `contacts` if linked
- Else formatted E.164 from `sender_e164`

---

## 5. Vercel environment variables

Add to production:

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON string of Firebase service account (FCM send) |

Alternative: split into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` if preferred.

**Never** expose service account to mobile client.

---

## 6. Dependencies (web repo)

Add to `web/package.json`:

```
firebase-admin
```

Initialize once in a shared module e.g. `web/lib/push/fcm-client.ts`.

---

## 7. Deployment order

1. Run Supabase migration (push_device_tokens table).
2. Deploy Bearer auth changes.
3. Deploy push register routes.
4. Deploy inbound webhook push dispatch.
5. Smoke-test register + manual FCM send before mobile Phase 7.

---

## 8. Out of scope for v1 backend

- Per-user push preference / quiet hours
- Push for internal chat, missed calls, or delivery status
- Push when user sent the message
- Expo push service directly (use FCM tokens from client)

---

*Spec version: 1.0 · Pairs with `IMPLEMENTATION_PLAN.md` Phase 1*
