# TAV Communication Mobile — First Deployment Plan

Step-by-step implementation plan for **v1 company-only release** (TestFlight + Play closed testing, ~5 users).

**Baseline:** Same backend as production web — Supabase `wiacdfruipunzfffgyfy`, Vercel `https://tav-communication.vercel.app`, Twilio.

**App identity:** `TAV Communication` · `com.texasautovalue.communication`

**Code location:** `mobile/` in this repo (docs stay at repo root).

**Backend changes:** Spec in [`docs/backend-spec-v1.md`](./docs/backend-spec-v1.md) · implementation guide [`docs/native-client-backend-changes.md`](./docs/native-client-backend-changes.md) — Bearer auth, push register, inbound dispatch via `after()` + `inbound-sms` channel (prod verified 2026-07-09).

---

## Progress summary

**Last updated:** 2026-08-21 · **Current focus:** UX polish (offline banner, search, thread rows)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Prerequisites | 🟡 ~85% — Apple/Play deferred |
| 1 | Backend (Vercel) | ✅ Done — Bearer, push register, FCM dispatch (`after()`), Firebase env verified |
| 2 | Project scaffold | 🟡 ~95% — bottom tab nav (Text/Chats/Calls/Contacts/Profile); Geist fonts deferred |
| 3 | Authentication | ✅ Done — Google sign-in verified on Android dev build |
| 4 | Data layer | ✅ Done — libs + hooks; inbox E2E verified |
| 5 | Inbox UI | 🟡 Partial — global search modal wired; device QA pending |
| 6 | MMS | ✅ Done — Android device retest passed 2026-07-10 |
| 7 | Push notifications | ✅ Done — register, background push, deep link verified on Android |
| 8 | Supporting screens | 🟡 Partial — profile photos + Settings/Help under Profile tab; bottom tab nav |
| 9 | EAS build & distribution | ⬜ Not started (Apple/Play deferred) |
| 10 | QA & sign-off | 🟡 Partial — core inbox + push + MMS + supporting screens verified; chat + tabs QA pending |
| 11 | Voice messaging | ⏸ Deferred — not shipping on mobile (carrier MMS audio arrives as link; web has no inbox recorder) |
| 12 | Voice calls | 🟡 Partial — outbound + Calls tab (WhatsApp-style list, keypad, inbox picker) + missed badge; inbound deferred; device QA pending |
| 13 | Internal chat (mobile) | 🟡 Partial — DMs + groups + images via `/api/chat/*`; Realtime + tab badge; device QA pending |

**Status legend:** ✅ Done · 🟡 Partial · ⏸ Deferred · ⬜ Not started

**Connected accounts:** Expo `@automation2/tav-communication` · Supabase `wiacdfruipunzfffgyfy` (dashboard: Twilio Interface US) · Firebase `tav-communication`

---

## v1 scope

### In scope

| Area | Features |
|------|----------|
| **Auth** | Google sign-in, domain gate, onboarding, pending, rejected, approved routing |
| **Inbox** | Thread list (Active / Unread / Done), conversation, composer, send SMS |
| **MMS** | Camera + gallery attachments (web limits: max 10 files, 5 MB each, carrier-safe types) |
| **Realtime** | Live thread/message updates via Supabase Realtime |
| **Unread** | Per-thread read state, inbox unread badges |
| **New 1:1** | New conversation + recipient picker |
| **Inbox access** | Request-access panel when user has zero inboxes |
| **Inbox switcher** | Mobile sheet to change active inbox |
| **Push** | Firebase — **always** notify on new inbound SMS (no quiet hours) |
| **Contacts** | Read-only lookup for compose (external + team tabs, search) |
| **Account** | Profile (edit name/phone), Settings (notification toggle), Help, Sign out |
| **UI** | Match web mobile layout: zinc palette, iOS-style bubbles, single-pane inbox |

### Out of scope (v1.1+)

Group MMS, full contacts CRUD/bundles, search/snippets, side panel/deal fields, internal chat, voice/calls, dev console, bug report.

---

## Architecture summary

```
┌─────────────────────────────────────────────────────────┐
│  Expo app (mobile/)                                     │
│  ├── Supabase Auth (Google OAuth)                       │
│  ├── Supabase client — reads/writes where RLS allows    │
│  ├── Supabase Realtime — threads, messages              │
│  └── HTTP client → Vercel /api/* with Bearer JWT        │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   Supabase Postgres              Vercel API routes
   (RLS)                          (send, onboarding, push register, …)
                                        │
                                        ▼
                                   Twilio + FCM (push)
```

**Rule:** Use **Vercel API** for actions that need server logic (send SMS, onboarding apply, mark done, attachment redirect). Use **Supabase direct** for reads/updates the web app already does client-side (profiles, contacts browse, thread_reads).

---

## Phase 0 — Prerequisites (before writing app code)

Complete these in order. **Do not start Phase 2 until Phase 0 + Phase 1 backend is deployed.**

### Step 0.1 — Accounts checklist

| Status | # | Task | Owner | Done when |
|--------|---|------|-------|-----------|
| ✅ | 0.1.1 | Expo account + EAS enabled | You | Can run `eas login` |
| ⏸ | 0.1.2 | Apple Developer — App ID `com.texasautovalue.communication` registered | You | Identifier exists in portal |
| ⏸ | 0.1.3 | Google Play Console — app created (closed testing) | You | App record exists |
| ✅ | 0.1.4 | Firebase project created | You | Project in console |
| ✅ | 0.1.5 | Firebase iOS app + `GoogleService-Info.plist` | You | Bundle ID matches |
| ✅ | 0.1.6 | Firebase Android app + `google-services.json` | You | Package name matches |
| ✅ | 0.1.7 | Supabase dashboard access (same project as web) | You | URL + anon key copied |
| ⬜ | 0.1.8 | Vercel deploy access (production) | You | Can add env vars + deploy |

### Step 0.2 — Google OAuth (mobile + Supabase)

| Status | # | Task | Detail |
|--------|---|------|--------|
| ✅ | 0.2.1 | Google Cloud Console — OAuth consent screen | Internal or external per org policy |
| ✅ | 0.2.2 | Create **Web client** (for Supabase) | Used by Supabase Auth provider |
| ⏸ | 0.2.3 | Create **iOS client** | Bundle ID `com.texasautovalue.communication` |
| ⏸ | 0.2.4 | Create **Android client** | Package + SHA-1 from EAS credentials |
| ✅ | 0.2.5 | Supabase → Authentication → Google | Paste Web client ID + secret |
| ✅ | 0.2.6 | Supabase → URL configuration | Add redirect URLs (see Phase 3) — `tavcommunication://auth/callback` confirmed |

### Step 0.3 — Environment template

✅ **Done** — `mobile/.env.example` created; `mobile/.env.local` filled (Supabase + Google Client ID).

Create `mobile/.env.example` (no secrets committed):

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=https://tav-communication.vercel.app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

Copy to `mobile/.env.local` when values are ready. EAS secrets for production builds via `eas secret:create`.

---

## Phase 1 — Backend (Vercel) — deploy before mobile push

Apply spec in [`docs/backend-spec-v1.md`](./docs/backend-spec-v1.md). Summary:

### Step 1.1 — Mobile Bearer auth on existing APIs

| Status | # | Rule |
|--------|---|------|
| ✅ | 1.1.1 | Update `getApprovedApiUser()` (and pending-user helper) to accept **either** cookie session **or** `Authorization: Bearer <supabase_access_token>`. | web `78ae3da` |
| ✅ | 1.1.2 | Validate JWT with Supabase; load profile; enforce `@texasautovalue.com` + `approval_status` same as web. | + `createApiScopedClient()` on RLS routes |
| ✅ | 1.1.3 | No behavior change for web cookie clients. |
| ✅ | 1.1.4 | Smoke-test: `POST /api/messages/send` with Bearer token from a test user. | verified on Android dev build |

### Step 1.2 — Push infrastructure

| Status | # | Rule |
|--------|---|------|
| ✅ | 1.2.1 | Add Supabase table `push_device_tokens` (see backend spec). | already in prod; mirror in `tools/sql/` |
| ✅ | 1.2.2 | Add `POST /api/push/register` — approved user registers FCM token + platform. |
| ✅ | 1.2.3 | Add `DELETE /api/push/register` — remove token on logout. |
| ✅ | 1.2.4 | On inbound SMS insert (Twilio webhook path), call push dispatcher for inbox members (except sender if outbound). | `after()` so Vercel completes FCM after webhook returns |
| ✅ | 1.2.5 | Push payload: inbox name, sender label, message preview, `thread_id`, `inbox_id` for deep link. | Android `channelId: inbound-sms` |
| ✅ | 1.2.6 | Vercel env: `FIREBASE_SERVICE_ACCOUNT_JSON` (or individual Firebase admin vars). | verified prod 2026-07-09 |
| ✅ | 1.2.7 | **Always send** — no quiet hours, no user preference gate in v1 (optional Settings toggle can disable client-side registration later). |

### Step 1.3 — Deploy and verify

| Status | # | Rule |
|--------|---|------|
| ✅ | 1.3.1 | Deploy to production Vercel. | web `78ae3da` |
| ✅ | 1.3.2 | Verify Bearer auth on onboarding + send endpoints. | verified on Android dev build |
| ✅ | 1.3.3 | Verify push register returns 200 with test token. | FCM inbound push verified 2026-07-09 |

**Gate:** Phase 2+ may proceed in parallel for UI, but **Phase 7 push** and **TestFlight build** require Phase 1 complete.

---

## Phase 2 — Project scaffold

### Step 2.1 — Initialize Expo app

| Status | # | Rule |
|--------|---|------|
| ✅ | 2.1.1 | Create `mobile/` with Expo SDK (latest stable), TypeScript, Expo Router. |
| ✅ | 2.1.2 | Package name / bundle ID: `com.texasautovalue.communication`. |
| ✅ | 2.1.3 | App display name: `TAV Communication`. |
| ✅ | 2.1.4 | Configure `app.config.ts`: scheme `tavcommunication`, associated domains if using universal links later. |

### Step 2.2 — Core dependencies

| Status | Package | Purpose |
|--------|---------|---------|
| ✅ | `@supabase/supabase-js` | Auth + DB + Realtime |
| ✅ | `expo-secure-store` | Session persistence |
| ✅ | `expo-auth-session` + `expo-web-browser` | Google OAuth flow — verified on Android dev build |
| ✅ | `expo-notifications` + FCM client | Push — FCM token + inbound notifications verified on Android |
| ✅ | `expo-image-picker` | MMS attachments |
| ✅ | `expo-file-system` | MMS multipart upload (`File` + `expo/fetch`) |
| ✅ | `expo-image` | Attachment display |
| ⬜ | `@expo-google-fonts/geist` (or closest Geist match) | Typography match |
| ✅ | `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated` | Navigation + sheets |

### Step 2.3 — Folder structure

🟡 **Partial** — `(auth)/` and `(app)/` route groups live; core `lib/` + auth components; inbox placeholder.

```
mobile/
├── src/app/                # Expo Router screens (current)
│   ├── (auth)/             # login, onboarding, pending, rejected — ✅
│   ├── (app)/              # approved workspace — 🟡 inbox placeholder
│   │   ├── inbox/
│   │   ├── contacts/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── help/
│   └── _layout.tsx
├── src/components/         # bubbles, thread row, sheets, empty states — ⬜
├── src/lib/
│   ├── supabase.ts         # ✅
│   ├── api-client.ts       # ✅ (+ multipart send, 401 sign-out)
│   ├── auth/               # ✅ auth-provider.tsx
│   ├── messaging/          # ✅ inboxes, threads, messages, reads, realtime, contacts, unread
│   └── theme.ts            # 🟡 partial tokens
├── src/hooks/
│   └── messaging.ts        # ✅ useUserInboxes, useInboxThreads, useThreadMessages, …
└── eas.json                # ✅
```

### Step 2.4 — Design tokens

| Status | # | Rule |
|--------|---|------|
| ✅ | 2.4.1 | Port CSS tokens from docs: bubble colors, composer slab, zinc palette. | `lib/theme.ts` + `docs/web-design-flow.md` |
| ✅ | 2.4.2 | Bubble: outbound gradient blue, inbound gray, asymmetric radii, timestamps. | `message-bubble.tsx` |
| ✅ | 2.4.3 | Composer: pill shape, Lucide attach/send, hint + char counter. | `composer.tsx` |
| ✅ | 2.4.4 | Reference: `docs/web-design-flow.md`, `docs/mobile-first-layout.md`. | avatars, inbox tiles, segmented tabs |

### Step 2.5 — EAS profiles (`eas.json`)

✅ **Done**

| Profile | Use |
|---------|-----|
| `development` | Dev client, internal distribution |
| `preview` | TestFlight + Play closed testing |
| `production` | Same as preview for v1 (company-only) |

---

## Phase 3 — Authentication

Reference: `flows/01-auth-and-onboarding.md`, `reference/user-roles-and-permissions.md`.

### Step 3.1 — Supabase client

| Status | # | Rule |
|--------|---|------|
| ✅ | 3.1.1 | Initialize Supabase with SecureStore adapter for session persistence. |
| ✅ | 3.1.2 | On app launch, restore session; fetch `profiles` row for current user. |
| ✅ | 3.1.3 | Route by `approval_status` + `onboarding_submitted_at` (mirror web matrix). |

### Step 3.2 — Google sign-in

| Status | # | Rule |
|--------|---|------|
| ✅ | 3.2.1 | Use `expo-auth-session` with Supabase `signInWithOAuth({ provider: 'google' })`. |
| ✅ | 3.2.2 | Redirect: `tavcommunication://auth/callback` (register in Supabase redirect URLs). |
| ✅ | 3.2.3 | After OAuth, verify email ends with `@texasautovalue.com`; if not, sign out + show domain error. |
| ✅ | 3.2.4 | Login screen: dark zinc hero (`#09090b`) — only login uses dark theme per docs. |

### Step 3.3 — Auth screens

| Status | Screen | Route | Behavior |
|--------|--------|-------|----------|
| ✅ | Login | `(auth)/login` | Google button, error banners for domain/auth/timeout |
| ✅ | Onboarding | `(auth)/onboarding` | Name, phone E.164, 8 inbox checkboxes → `POST /api/onboarding/apply` |
| ✅ | Pending | `(auth)/pending` | Waiting state, sign out only |
| ✅ | Rejected | `(auth)/rejected` | Terminal state, sign out only |

### Step 3.4 — Approved gate

| Status | # | Rule |
|--------|---|------|
| ✅ | 3.4.1 | `(app)` group requires `approval_status === 'approved'`. |
| ✅ | 3.4.2 | Redirect approved users away from auth screens to inbox. |
| ✅ | 3.4.3 | Sign out clears Supabase session + push token (`DELETE /api/push/register`). |

**Gate:** Can sign in, complete onboarding, land on inbox (empty state OK).

---

## Phase 4 — Data layer

Reference: `reference/data-model.md`, `reference/api-routes-index.md`.

### Step 4.1 — API client

| Status | # | Rule |
|--------|---|------|
| ✅ | 4.1.1 | `apiClient.fetch(path, options)` prefixes `EXPO_PUBLIC_API_BASE_URL`. |
| ✅ | 4.1.2 | Attach `Authorization: Bearer ${session.access_token}` on every request. |
| ✅ | 4.1.3 | On 401, attempt session refresh once; else sign out (auth redirect) | `api-client.ts` |
| ✅ | 4.1.4 | Multipart helper for `POST /api/messages/send` with files | `apiSendMessage()` in `api-client.ts` |

### Step 4.2 — Supabase reads (RLS)

| Status | Data | Method |
|--------|------|--------|
| 🟡 | User profile | `profiles` select/update own row — read in AuthProvider only |
| ✅ | Inboxes for user | `lib/messaging/inboxes.ts` + `useUserInboxes` |
| ✅ | Threads | `lib/messaging/threads.ts` + `useInboxThreads` (Active/Done/Unread) |
| ✅ | Messages | `lib/messaging/messages.ts` + `useThreadMessages` (page size 75) |
| ✅ | Thread reads | `lib/messaging/thread-reads.ts` + `useThreadReads` |
| ✅ | Contacts (read-only) | `lib/messaging/contacts.ts` + `useContactsDirectory` / `useContactsSearch` |

### Step 4.3 — Realtime subscriptions

| Status | # | Rule |
|--------|---|------|
| ✅ | 4.3.1 | Subscribe to `threads` changes for active inbox. | `realtime.ts` + `useInboxThreads` |
| ✅ | 4.3.2 | Subscribe to `messages` for open thread. | `realtime.ts` + `useThreadMessages` |
| ✅ | 4.3.3 | Call `supabase.realtime.setAuth(session.access_token)` after login (required per docs). |
| ✅ | 4.3.4 | Merge Realtime payloads into local state; dedupe by message ID. | `messages.ts` / `realtime.ts` |

### Step 4.4 — Unread logic

✅ **Done (code)** — `lib/messaging/unread.ts`, debounced mark-read in `useThreadMessages`, mark read/unread in `useThreadReads`:

- Unread if no `thread_reads` + last message inbound, OR `last_message_at` > `read_at`, OR manually marked unread.
- Mark read when viewing latest inbound (debounced upsert).

**Gate:** Can load inboxes, threads, messages for a test user with inbox membership.

---

## Phase 5 — Inbox UI (core)

Reference: `flows/02-inbox-and-direct-messaging.md`, mobile sections in UI docs.

### Step 5.1 — Navigation shell

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.1.1 | Inbox uses **own header** (no workspace hamburger on inbox per docs). |
| ✅ | 5.1.2 | Header: inbox name (opens switcher sheet), search icon opens global search modal, user menu. | `SearchModal` + `WorkspaceSearchProvider` — spec [`docs/webapp-search-flow.md`](./docs/webapp-search-flow.md) |
| ✅ | 5.1.3 | Drawer/menu for other routes: Contacts, Profile, Settings, Help, Sign out. |
| ✅ | 5.1.4 | Skip Calls, Chat, Dev dashboard in v1 nav. |

### Step 5.2 — Thread list

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.2.1 | Tabs: **Active**, **Unread**, **Done Deals** — same filter logic as web. |
| ✅ | 5.2.2 | Row: title, snippet, timestamp, unread bold/dot. |
| ✅ | 5.2.3 | Swipe or long-press actions: mark read/unread, mark done/reopen. | Long-press Alert actions |
| ✅ | 5.2.4 | Empty states per `ui/modals-empty-states-and-overlays.md`. |
| ✅ | 5.2.5 | Zero inboxes → `RequestInboxAccessPanel` via catalog + request APIs. |

### Step 5.3 — Conversation view

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.3.1 | Single-pane: list → tap thread → full-screen conversation with back button. |
| ✅ | 5.3.2 | Message list inverted scroll; load older on scroll up. |
| ✅ | 5.3.3 | Outbound status icons: sending → sent → delivered / failed. |
| ✅ | 5.3.4 | Header: display name edit, mark done, overflow menu. |
| ✅ | 5.3.5 | Optimistic send bubble on `POST /api/messages/send`. |

### Step 5.4 — Composer

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.4.1 | Text input on composer slab `#f2f2f7`. |
| ✅ | 5.4.2 | Send disabled if inbox has no `twilio_phone_e164` (history-only). |
| ✅ | 5.4.3 | Body max 1600 chars; Enter = new line; explicit Send button (mobile has no Shift+Enter). |

### Step 5.5 — New conversation

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.5.1 | “New conversation” → recipient picker (contacts search + manual E.164). |
| ✅ | 5.5.2 | First send creates thread via send API; navigate to new thread. | verified on Android dev build |

### Step 5.6 — Inbox switcher sheet

| Status | # | Rule |
|--------|---|------|
| ✅ | 5.6.1 | Bottom sheet listing member inboxes with unread badges. |
| ✅ | 5.6.2 | Switching inbox clears thread selection; loads new thread list. |

**Gate:** End-to-end 1:1 SMS send/receive in app with Realtime update on second device or web.

---

## Phase 6 — MMS

Reference: `flows/02-inbox-and-direct-messaging.md` composer constraints.

### Step 6.1 — Attachments

| Status | # | Rule |
|--------|---|------|
| ✅ | 6.1.1 | Attach via camera or gallery (`expo-image-picker`). | `use-composer-attachments` + composer **＋** button |
| ✅ | 6.1.1b | Client image compression before upload (web parity). | `compress-image.ts` + `expo-image-manipulator` |
| ✅ | 6.1.2 | Max 10 files, 4 MB each; images + short audio/video only (no PDF). | `mms-policy.ts` — matches web `MMS_MAX_UPLOAD_BYTES` |
| ✅ | 6.1.3 | Send as `multipart/form-data` to `/api/messages/send`. | XHR + RN `{ uri, name, type }` parts, field `attachment` (repeated), 60s timeout |
| ✅ | 6.1.4 | Display inbound attachments inline; tap to full-screen viewer. | `message-bubble`, `attachment-lightbox` |
| ✅ | 6.1.5 | Load media via `/api/messages/attachments/[id]/url` redirect. | `attachment-url.ts` + Bearer headers on `expo-image` |

**Gate:** ✅ Send and receive photo MMS on Android — verified 2026-07-10. iOS pending TestFlight build.

---

## Phase 7 — Push notifications (Firebase)

Requires **Phase 1 backend** deployed.

### Step 7.1 — Client setup

| Status | # | Rule |
|--------|---|------|
| 🟡 | 7.1.1 | Configure FCM in Expo/EAS (upload Firebase service account to EAS). — `google-services.json` + dev build verified; EAS upload pending for preview/production builds |
| ✅ | 7.1.2 | Request notification permission on first approved inbox load (or after login). |
| ✅ | 7.1.3 | Get FCM token → `POST /api/push/register` with `{ token, platform: 'ios' \| 'android' }`. |
| ✅ | 7.1.4 | Re-register token on app launch if changed. |
| ✅ | 7.1.5 | On sign out → `DELETE /api/push/register`. |

### Step 7.2 — Notification handling

| Status | # | Rule |
|--------|---|------|
| ✅ | 7.2.1 | Foreground: show in-app banner (optional) **and** still rely on backend always sending. |
| ✅ | 7.2.2 | Background/killed: system notification from FCM. — verified Android dev build 2026-07-09; iOS pending |
| ✅ | 7.2.3 | Tap notification → deep link to `/inbox?inbox=&thread=`. |
| ✅ | 7.2.4 | No quiet hours; no suppression when app open (per product decision). |

**Gate:** ✅ Android verified 2026-07-09 — inbound SMS with app backgrounded shows push; tap opens correct thread. iOS pending TestFlight build.

---

## Phase 8 — Supporting screens

Reference: `flows/04-contacts-directory.md`, `flows/05-team-profile-settings-help.md`.

### Step 8.1 — Contacts (read-only)

| Status | # | Rule |
|--------|---|------|
| ✅ | 8.1.1 | Tabs: **External**, **Team** (skip Saved groups in v1). | `ContactTabs` |
| ✅ | 8.1.2 | Search + browse via Supabase RPC (same as web). | `useContactsDirectory` / `useContactsSearch` / `useTeamContacts` |
| ✅ | 8.1.3 | Tap contact → start compose with pre-filled `to` E.164. | `compose?to=` + Contacts → compose |
| ✅ | 8.1.4 | No create/edit/delete in v1. |

### Step 8.2 — Profile

| Status | # | Rule |
|--------|---|------|
| ✅ | 8.2.1 | Edit `display_name`, `phone_e164` via Supabase direct update. | `update-profile.ts` + Profile screen |
| ✅ | 8.2.2 | Email read-only; role display-only. |
| ✅ | 8.2.3 | Optional profile photo: camera/gallery upload, remove, initials fallback; `profile-avatars` Storage bucket + `profiles.avatar_storage_path`; team tab shows teammate photos. | mobile-only; web parity deferred |

### Step 8.3 — Settings

| Status | # | Rule |
|--------|---|------|
| ✅ | 8.3.1 | v1 minimal: notification permission status + link to OS settings if denied. | Settings screen + `getNotificationPermissionStatus` |
| ✅ | 8.3.2 | Optional: sound toggle stored in AsyncStorage (mirror `tav-sms:notify-sound`). | `local-preferences.ts` + foreground handler — TEMP in-memory until next native rebuild links AsyncStorage |

### Step 8.4 — Help

| Status | # | Rule |
|--------|---|------|
| ✅ | 8.4.1 | Static help content matching web `/help` topics (can be simplified markdown in app). | `topics.ts` + Help screen |

**Gate:** ✅ All v1 screens navigable; contacts → new message flow works — Android emulator verified 2026-07-15.

---

## Phase 9 — EAS build and distribution

### Step 9.1 — Credentials

| Status | # | Rule |
|--------|---|------|
| ⏸ | 9.1.1 | Run `eas credentials` — iOS distribution cert + provisioning; Android keystore. |
| ⏸ | 9.1.2 | Add Google Android OAuth SHA-1 from EAS to Google Cloud Console. |
| ⏸ | 9.1.3 | Upload APNs key to Firebase (iOS push). |

### Step 9.2 — Internal builds

| Status | # | Rule |
|--------|---|------|
| ⬜ | 9.2.1 | `eas build --profile preview --platform all`. |
| ⬜ | 9.2.2 | Fix any native build errors before proceeding. |

### Step 9.3 — TestFlight (iOS)

| Status | # | Rule |
|--------|---|------|
| ⏸ | 9.3.1 | `eas submit --platform ios` or manual upload to App Store Connect. |
| ⏸ | 9.3.2 | Add ~5 testers by email in TestFlight internal/external group. |
| ⏸ | 9.3.3 | Company-only: internal testing group is sufficient for 5 users. |

### Step 9.4 — Play closed testing (Android)

| Status | # | Rule |
|--------|---|------|
| ⏸ | 9.4.1 | `eas submit --platform android` to closed testing track. |
| ⏸ | 9.4.2 | Add tester emails to closed testing list. |

**Gate:** Both builds install on physical devices for all testers.

---

## Phase 10 — QA and first deploy sign-off

### Step 10.1 — Test matrix (minimum)

| Status | # | Test | Pass criteria |
|--------|---|------|---------------|
| ⬜ | 10.1.1 | New user sign-in | Google OAuth completes |
| ⬜ | 10.1.2 | Wrong domain | Blocked with domain error |
| ⬜ | 10.1.3 | Onboarding → pending | Form submits; pending screen shown |
| ⬜ | 10.1.4 | Operator approves + assigns inbox | User reaches inbox with threads |
| ⬜ | 10.1.5 | Send SMS | Delivered to real phone |
| ✅ | 10.1.6 | Receive SMS | Appears in thread + push when app backgrounded | Android verified 2026-07-09 |
| ⬜ | 10.1.7 | MMS photo | Send and receive | Android verified 2026-07-10; iOS pending |
| ⬜ | 10.1.8 | Mark done / reopen | Tab filters correct |
| ⬜ | 10.1.9 | Unread | Badge and mark read/unread work |
| ⬜ | 10.1.10 | No inbox assigned | Request access panel works |
| ⬜ | 10.1.11 | Sign out / sign in | Session and push token cleaned up |
| ⬜ | 10.1.12 | iOS + Android | Both platforms pass core flows |

### Step 10.2 — Sign-off

| Status | # | Rule |
|--------|---|------|
| ⬜ | 10.2.1 | All 10.1 tests pass on production backend. |
| ⬜ | 10.2.2 | Testers confirm push + messaging for their assigned inboxes. |
| ⬜ | 10.2.3 | Tag release in repo; document build numbers in `mobile/CHANGELOG.md`. |

**First deployment complete.**

---

## Phase 11 — Voice messaging ⏸ Deferred (mobile v1)

**Not shipping on mobile.** Inbox MMS audio often arrives on customer phones as a carrier `p.twil.io` link instead of inline audio; production web also has no inbox mic recorder (attach-only on web, unused in practice).

**Removed from mobile app (2026-07-19):** mic recorder, audio file attach, inline audio player, `expo-audio` / `expo-document-picker`.

**Still supported in app:** view/open **inbound** customer audio MMS as a filename tile (open externally) — same as other non-image attachments.

**Future (post-v1):** internal chat voice notes (Part B) only if chat baseline ships; inbox outbound audio not planned. Spec retained for reference: [`docs/voice-messaging-sending-flow.md`](./docs/voice-messaging-sending-flow.md).

---

## Phase 12 — Voice calls (Twilio Programmable Voice)

**Spec:** [`docs/calls-flow.md`](./docs/calls-flow.md)  
**Skeleton:** [`flows/08-voice-calls.md`](./flows/08-voice-calls.md)  
**Not this phase:** chat voice notes / inbox MMS audio → Phase 11.

Backend voice APIs already accept **Bearer JWT** (`/api/voice/token`, `/outbound`, `/answered`, missed-count). Twilio webhooks stay signature-only.

**Ship order:** outbound-only first → call history + missed badge → inbound (CallKit / ConnectionService) last.

### Step 12.0 — Prerequisites

| Status | # | Rule |
|--------|---|------|
| ✅ | 12.0.1 | Spec captured in `docs/calls-flow.md` (web master verified, incl. voice on all Twilio-number inboxes in code). |
| ✅ | 12.0.2 | Voice client APIs support Bearer — same pattern as SMS mobile. |
| ✅ | 12.0.3 | Smoke-test with mobile session token: `GET /api/voice/token` → 200 `{ token, identity, expiresIn }`. | `voice-api.ts` — device verify pending |
| ✅ | 12.0.4 | Smoke-test: `POST /api/voice/outbound` with Bearer + valid direct thread → `{ connectParams }`. | `voice-api.ts` — device verify pending |
| ✅ | 12.0.5 | Ops: confirm which numbers have Voice URL + status callbacks pointed at app (pilot `+17435000019` intended; other lines may still be Twilio demo URL). | **Updated:** all prod numbers point at app inbound + status |
| 🟡 | 12.0.6 | Dev client only — Twilio Voice React Native (or equivalent) requires native modules; not Expo Go. | `@twilio/voice-react-native-sdk@2.0.0-preview.2` + `expo-av`; **rebuild dev client required** |

### Step 12.1 — Native Voice client + token lifecycle

| Status | # | Rule |
|--------|---|------|
| 🟡 | 12.1.1 | Add Twilio Voice RN SDK via Expo config plugin / dev client rebuild. | SDK installed; iOS mic/voip + Android RECORD_AUDIO in `app.config.ts` |
| 🟡 | 12.1.2 | `lib/voice/`: mint token via Bearer `GET/POST /api/voice/token`; register Client with **32-hex identity** (UUID without hyphens) — must match web for inbound later. | `voice-api.ts` + `VoiceClientProvider` — outbound uses `voice.connect(token)` (no register in v1) |
| ✅ | 12.1.3 | **Token refresh before `expiresIn` (3600)** — do not copy web’s no-refresh gap. | refresh timer in `voice-client.tsx` |
| ✅ | 12.1.4 | Mic permission prompts + privacy strings in `app.config.ts`; gate Call UI when denied/unsupported. | `microphone-permission.ts` + header Call gate |
| ✅ | 12.1.5 | Call phases: `uninitialized` → `initializing` → `ready` \| `connecting` \| `in-call` \| `error` (+ `incoming` when Part B ships). | `VoiceClientProvider` |
| ✅ | 12.1.6 | One active call — second outbound throws; second inbound auto-reject (parity). | guarded in `placeOutboundCall` |

### Step 12.2 — Outbound from 1:1 thread (first ship)

| Status | # | Rule |
|--------|---|------|
| 🟡 | 12.2.1 | Show Call control only when: `thread_kind === "direct"`, `customer_e164` present, inbox has `twilio_phone_e164`. | `voice-enabled.ts` + thread header |
| 🟡 | 12.2.2 | Sequence: ensure Device ready → `POST /api/voice/outbound` `{ thread_id, inbox_id, customer_e164 }` → `device.connect(connectParams)`. | `VoiceClientProvider` + Calls keypad/New call with inbox picker — device QA pending |
| ✅ | 12.2.3 | In-call UI: elapsed timer, mute/unmute, hang up (no DTMF / transfer / hold in v1). | `InCallOverlay` |
| ✅ | 12.2.4 | Map API error strings to toasts (group thread, history-only inbox, forbidden, invalid E.164, etc.). | `VoiceApiError` + Alerts |
| ⬜ | 12.2.5 | Device QA: outbound from Transportation QA (or any voice-enabled inbox) reaches real PSTN; `call_logs` shows outbound row; hang up completes cleanly. |

### Step 12.3 — Call history + missed badge

| Status | # | Rule |
|--------|---|------|
| ✅ | 12.3.1 | Calls screen: list up to 200 `call_logs` (RLS / approved access); columns parity — when, inbox, direction, contact, agent, status, duration, thread link. | `/(app)/calls` — WhatsApp-style Recent list + detail sheet (metadata); card table replaced 2026-08-03 |
| ✅ | 12.3.2 | Deep link row → `/inbox` with `inbox` + `thread` when `thread_id` set. | row opens `/(app)/inbox/[threadId]` |
| ✅ | 12.3.3 | Missed badge: poll `GET /api/dev-console/voice-pilot/missed-count?since=` (~90s + on foreground). | `MissedCallsProvider` |
| ✅ | 12.3.4 | Persist last-seen (`tav-voice:calls-last-seen-at`) in AsyncStorage/SecureStore; write when opening Calls screen. | `calls-last-seen.ts` |
| ✅ | 12.3.5 | Highlight missed inbound (`missed` \| `no-answer` \| `busy`); nav entry from user menu (skip assignments admin UI on mobile). | red name + direction label; Calls tab badge |

### Step 12.4 — Inbound ringing (follow-on)

| Status | # | Rule |
|--------|---|------|
| ⏸ | 12.4.1 | Global Voice registration while approved + assigned (not only while inbox screen mounted). |
| ⏸ | 12.4.2 | Push wake + **CallKit** (iOS) / **ConnectionService** (Android) for background/killed inbound. |
| ⏸ | 12.4.3 | Incoming UI: Accept / Decline + mic warning; on Accept → `call.accept()` + `POST /api/voice/answered` `{ call_sid }`. |
| ⏸ | 12.4.4 | User must be in `inbox_call_assignments` for that inbox or answered returns 403. |
| ⏸ | 12.4.5 | Device QA on pilot line with assignees: simultaneous ring, accept, decline, timeout → missed log. |

### Step 12.5 — Calls QA gate

| Status | # | Test | Pass criteria |
|--------|---|------|---------------|
| ⬜ | 12.5.1 | Token + register | Bearer token mints; Device reaches `ready` | API client ready; SDK connect on device pending |
| ⬜ | 12.5.2 | Outbound 1:1 | Customer phone rings; callerId = inbox number |
| ⬜ | 12.5.3 | Mute / hang up | Audio + disconnect work; log completes |
| ⬜ | 12.5.4 | Gates | No Call on group / history-only / mic denied |
| ⬜ | 12.5.5 | History + badge | Logs visible; missed count updates after unseen inbound |
| ⏸ | 12.5.6 | Inbound (when 12.4 done) | Ring when app backgrounded; accept connects |
| ⬜ | 12.5.7 | Android + iOS | Outbound (+ history) on both platforms |

**Gate:** Outbound + history/badge verified on device. Inbound deferred until CallKit/ConnectionService work lands. Assignments admin stays on web.

---

## Post-v1 backlog (ordered)

1. Group messaging (app_group + native MMS)
2. Global search + snippets — 🟡 search shipped (threads/messages/contacts via `GET /api/search`); snippets deferred
3. Conversation side panel / custom fields
4. Full contacts CRUD + bundles
5. Internal chat (`/chat`) — 🟡 mobile tab shipped (DMs, groups, images); reactions/voice notes deferred
6. Voice messaging (inbox MMS audio + chat voice notes) — ⏸ deferred on mobile; see Phase 11 note
7. ~~Voice calls~~ → **Phase 12** (outbound first; inbound = 12.4)
8. Bug report modal
9. Dev console (operators — low priority on mobile)

---

## Credentials quick reference

| Status | Variable / secret | Where used |
|--------|-------------------|------------|
| ✅ | `EXPO_PUBLIC_SUPABASE_URL` | Mobile app |
| ✅ | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile app |
| ✅ | `EXPO_PUBLIC_API_BASE_URL` | Mobile app |
| ✅ | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Mobile OAuth |
| ⏸ | Google iOS client ID | Supabase + Google Cloud |
| ⏸ | Google Android client ID | Supabase + Google Cloud |
| ✅ | Firebase config files | EAS + mobile native |
| ✅ | `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel (push send) — verified prod 2026-07-09 |
| ✅ | Twilio Voice env (`TWILIO_API_KEY_*`, `TWILIO_TWIML_APP_SID`, …) | Vercel only — see `docs/calls-flow.md` |
| 🟡 | `@twilio/voice-react-native-sdk@2.0.0-preview.2` | Mobile outbound Voice — dev client rebuild required |
| ⏸ | Apple Team ID | EAS iOS builds |
| ⏸ | Play service account JSON | EAS submit (optional) |

---

## Doc references during build

| Topic | Doc |
|-------|-----|
| Auth flows | `flows/01-auth-and-onboarding.md` |
| Inbox | `flows/02-inbox-and-direct-messaging.md` |
| Permissions | `reference/user-roles-and-permissions.md` |
| APIs | `reference/api-routes-index.md` |
| Tables / RLS | `reference/data-model.md` |
| Realtime / alerts | `flows/07-notifications-realtime-polling.md` |
| UI / colors | `ui/workspace-layout-and-navigation.md` |
| Modals / empty states | `ui/modals-empty-states-and-overlays.md` |
| Contacts | `flows/04-contacts-directory.md` |
| Profile / settings | `flows/05-team-profile-settings-help.md` |
| Backend spec | `docs/backend-spec-v1.md` |
| Voice messaging (A + B) | `docs/voice-messaging-sending-flow.md` |
| Voice calls (detailed) | `docs/calls-flow.md` |
| Voice calls (skeleton) | `flows/08-voice-calls.md` |
| Internal chat | `flows/09-internal-chat.md` |
| Workspace search (web parity) | `docs/webapp-search-flow.md` |

---

*Plan version: 1.16 · Last progress update: 2026-07-19 · Target: first company TestFlight + Play closed testing · ~5 users*
