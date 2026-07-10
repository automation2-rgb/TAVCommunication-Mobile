# Native client API support — implementation guide

Apply these changes in the **Next.js web app** deployed to Vercel. Native iOS/Android clients call the same `/api/*` routes as the browser, but authenticate with a Supabase JWT in the `Authorization` header instead of cookies.

**Goals**

1. Browser sessions (cookies) keep working exactly as today.
2. Native clients can call protected APIs with `Authorization: Bearer <supabase_access_token>`.
3. Optional: FCM push registration + inbound SMS notifications.

---

## Deployment order

1. Supabase migration (`push_device_tokens`) — skip if table already exists
2. Bearer auth in `lib/auth/api-session.ts` — **required for send / onboarding / mark done**
3. Deploy to production
4. Smoke-test with curl (below)
5. Push register routes + FCM dispatch — **required before native push notifications**

---

## 1. Bearer auth (`lib/auth/api-session.ts`)

### Problem

`getApprovedApiUser()` (and similar helpers) likely only read the Supabase session from **cookies**. Native apps have no cookies; they send:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Solution

Add a shared resolver that tries cookies first, then Bearer. Reuse it in `getApprovedApiUser()` and add `getPendingApiUser()` for onboarding routes.

### Code — session resolver

Adapt imports to match your repo (`createServerClient`, `createClient`, env var names, etc.).

```typescript
// lib/auth/api-session.ts

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { isOrgEmail } from '@/lib/auth/org-policy';

export type ApiSessionUser = {
  id: string;
  email: string;
};

export type ApiSessionProfile = {
  id: string;
  email: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  display_name: string | null;
  phone_e164: string | null;
  role: string | null;
};

export type ResolvedApiSession = {
  user: ApiSessionUser;
  profile: ApiSessionProfile;
};

function getBearerToken(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

/** Cookie-based Supabase client — existing browser path, unchanged. */
async function getCookieSupabaseUser(): Promise<ApiSessionUser | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          /* route handlers may be read-only; keep your existing pattern */
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;

  return { id: data.user.id, email: data.user.email };
}

/** Bearer JWT — native app path. */
async function getBearerSupabaseUser(token: string): Promise<ApiSessionUser | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;

  return { id: data.user.id, email: data.user.email };
}

async function loadProfile(userId: string): Promise<ApiSessionProfile | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, approval_status, display_name, phone_e164, role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ApiSessionProfile;
}

/**
 * Resolve authenticated user + profile from cookie OR Bearer header.
 * Returns null if unauthenticated or wrong org domain.
 */
export async function resolveApiSession(): Promise<ResolvedApiSession | null> {
  const headerStore = await headers();
  const bearer = getBearerToken(headerStore.get('authorization'));

  const user =
    (await getCookieSupabaseUser()) ??
    (bearer ? await getBearerSupabaseUser(bearer) : null);

  if (!user) return null;
  if (!isOrgEmail(user.email)) return null;

  const profile = await loadProfile(user.id);
  if (!profile) return null;

  return { user, profile };
}

/** Approved users — messaging, inbox access, push register, etc. */
export async function getApprovedApiUser(): Promise<ResolvedApiSession | null> {
  const session = await resolveApiSession();
  if (!session) return null;
  if (session.profile.approval_status !== 'approved') return null;
  return session;
}

/** Pending users — onboarding only. */
export async function getPendingApiUser(): Promise<ResolvedApiSession | null> {
  const session = await resolveApiSession();
  if (!session) return null;
  if (session.profile.approval_status !== 'pending') return null;
  return session;
}
```

### Wire onboarding routes

Ensure these use `getPendingApiUser()` (not cookie-only checks):

| Method | Path |
|--------|------|
| GET | `/api/onboarding/inboxes` |
| POST | `/api/onboarding/apply` |

Example guard:

```typescript
// app/api/onboarding/apply/route.ts
import { NextResponse } from 'next/server';
import { getPendingApiUser } from '@/lib/auth/api-session';

export async function POST(request: Request) {
  const session = await getPendingApiUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... existing RPC / validation logic unchanged
}
```

### Routes that must work with Bearer (minimum)

If `getApprovedApiUser()` is fixed centrally, these should work without per-route changes:

| Method | Path |
|--------|------|
| POST | `/api/messages/send` |
| GET | `/api/messages/attachments/[attachmentId]/url` |
| POST | `/api/threads/[threadId]/hide` |
| DELETE | `/api/threads/[threadId]/hide` |
| GET | `/api/inbox-access/catalog` |
| POST | `/api/inbox-access/request` |
| POST | `/api/push/register` |
| DELETE | `/api/push/register` |

Audit any route that reads cookies directly instead of `getApprovedApiUser()`.

---

## 2. Smoke tests (after deploy)

Replace `TOKEN` with a Supabase `access_token` from a signed-in user (browser devtools or client session).

```bash
# Approved user — expect 200
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer TOKEN" \
  https://tav-communication.vercel.app/api/inbox-access/catalog

# No token — expect 401
curl -s -o /dev/null -w "%{http_code}" \
  https://tav-communication.vercel.app/api/inbox-access/catalog

# Send SMS — expect 200 + message JSON
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "inbox_id=INBOX_UUID" \
  -F "thread_id=THREAD_UUID" \
  -F "body=Test from Bearer" \
  https://tav-communication.vercel.app/api/messages/send
```

---

## 3. Supabase migration — `push_device_tokens`

Run in Supabase SQL editor (skip if table already exists):

```sql
create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_device_tokens_user_id_idx
  on public.push_device_tokens(user_id);

alter table public.push_device_tokens enable row level security;

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

---

## 4. Push register API

### Install dependency

```bash
npm install firebase-admin
```

### FCM client — `lib/push/fcm-client.ts`

```typescript
import admin from 'firebase-admin';

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  const credentials = JSON.parse(raw);
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });

  initialized = true;
}

export type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendFcmToTokens(tokens: string[], payload: FcmPayload) {
  if (tokens.length === 0) return;

  initFirebaseAdmin();

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    android: { priority: 'high' },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default' } },
    },
  });
}
```

### Route — `app/api/push/register/route.ts`

Uses service role for upsert (same pattern as other server writes after auth check):

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getApprovedApiUser } from '@/lib/auth/api-session';

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type RegisterBody = {
  token?: string;
  platform?: string;
};

export async function POST(request: Request) {
  const session = await getApprovedApiUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = body.token?.trim();
  const platform = body.platform;

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }
  if (platform !== 'ios' && platform !== 'android') {
    return NextResponse.json({ error: 'platform must be ios or android' }, { status: 400 });
  }

  const supabase = serviceSupabase();
  const { error } = await supabase.from('push_device_tokens').upsert(
    {
      user_id: session.user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,token' },
  );

  if (error) {
    console.error('push register failed', error);
    return NextResponse.json({ error: 'Unable to register token' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getApprovedApiUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let token: string | undefined;
  try {
    const body = (await request.json()) as RegisterBody;
    token = body.token?.trim();
  } catch {
    // body optional
  }

  const supabase = serviceSupabase();
  let query = supabase.from('push_device_tokens').delete().eq('user_id', session.user.id);

  if (token) {
    query = query.eq('token', token);
  }

  const { error } = await query;
  if (error) {
    console.error('push unregister failed', error);
    return NextResponse.json({ error: 'Unable to remove token' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

### Push register smoke test

```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"test-device-token","platform":"ios"}' \
  https://tav-communication.vercel.app/api/push/register
```

Expect `{"ok":true}` and a row in `push_device_tokens`.

---

## 5. Inbound SMS → push dispatch

Call this **after** an inbound message is saved (Twilio Conversations webhook path — wherever you insert `messages` and update `threads.last_message_*`).

### Dispatcher — `lib/push/dispatch-inbound-sms.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { sendFcmToTokens } from '@/lib/push/fcm-client';

function serviceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function truncate(text: string, max = 120) {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export async function dispatchInboundSmsPush(params: {
  inboxId: string;
  threadId: string;
  messageId: string;
  body: string | null;
  senderE164: string | null;
  senderLabel?: string | null;
}) {
  const supabase = serviceSupabase();

  const [{ data: inbox }, { data: members }] = await Promise.all([
    supabase.from('inboxes').select('display_name').eq('id', params.inboxId).maybeSingle(),
    supabase.from('inbox_members').select('user_id').eq('inbox_id', params.inboxId),
  ]);

  const memberIds = (members ?? []).map((m) => m.user_id);
  if (memberIds.length === 0) return;

  const { data: tokenRows } = await supabase
    .from('push_device_tokens')
    .select('token')
    .in('user_id', memberIds);

  const tokens = (tokenRows ?? []).map((r) => r.token).filter(Boolean);
  if (tokens.length === 0) return;

  const label = params.senderLabel?.trim() || params.senderE164 || 'New message';
  const preview = truncate(params.body ?? '');

  await sendFcmToTokens(tokens, {
    title: inbox?.display_name ?? 'Inbox',
    body: `${label}: ${preview}`,
    data: {
      inbox_id: params.inboxId,
      thread_id: params.threadId,
      message_id: params.messageId,
    },
  });
}
```

### Webhook hook (fire-and-forget)

In your inbound message handler, after DB insert succeeds:

```typescript
import { dispatchInboundSmsPush } from '@/lib/push/dispatch-inbound-sms';

// ... after message + thread update persist ...

void dispatchInboundSmsPush({
  inboxId,
  threadId,
  messageId: message.id,
  body: message.body,
  senderE164: message.sender_e164,
  senderLabel, // optional: resolve from contacts table like thread list snippet
}).catch((err) => {
  console.error('inbound push dispatch failed', err);
});
```

**Rules**

- Inbound only — do not push for outbound messages the user sent.
- Notify all inbox members with registered tokens.
- Always send — no quiet hours in v1.
- Never block the Twilio webhook response on push failure.

---

## 6. Vercel environment variables

Add to **production**:

| Variable | Value |
|----------|--------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON string from Firebase Console → Project settings → Service accounts → Generate new private key |

Paste the entire JSON as one env var value. Do not expose to clients.

---

## 7. Checklist before merge

- [ ] Cookie auth still works in browser (regression: send message on web)
- [ ] `getApprovedApiUser()` uses `resolveApiSession()` (cookie + Bearer)
- [ ] Onboarding routes use `getPendingApiUser()`
- [ ] curl Bearer test returns 200 on `/api/inbox-access/catalog`
- [ ] curl Bearer test sends SMS on `/api/messages/send`
- [ ] `push_device_tokens` table exists
- [ ] `POST /api/push/register` returns 200
- [ ] Inbound webhook calls `dispatchInboundSmsPush` (non-blocking)
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set in Vercel production

---

## 8. Out of scope (v1)

- Per-user push preferences / quiet hours
- Push for internal chat, voice, or delivery status updates
- Expo Push API directly (clients register raw FCM tokens)

---

*Spec version: 1.0*
