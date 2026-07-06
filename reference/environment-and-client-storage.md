# Environment variables and client storage

Configuration the web app expects. **Never commit secrets** — document names only.

---

## Supabase (required)

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Anon key for RLS client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypass RLS for webhooks, dev console, voice SSR |

---

## Twilio (required for messaging)

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | REST API |
| `TWILIO_AUTH_TOKEN` | Webhook signature validation |
| `TWILIO_CONVERSATIONS_SERVICE_SID` | **IS…** Conversations service (not MG/CH) |

---

## Twilio Voice (required for browser calling)

| Variable | Purpose |
|----------|---------|
| `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` | Voice access tokens |
| `TWILIO_TWIML_APP_SID` | Outbound browser TwiML app (`AP…`) |

Voice Request URL → `{origin}/api/twilio/voice/outbound-twiml`

---

## Twilio optional

| Variable | Purpose |
|----------|---------|
| `TWILIO_MCS_URL` | Media Content Service region (default US1) |
| `TWILIO_WEBHOOK_PUBLIC_URL` | Fix signature validation behind proxy |
| `TWILIO_SYNC_DAYS` | History backfill window (default 90) |

---

## Integrations

| Variable | Purpose |
|----------|---------|
| `ZAPIER_INTEGRATION_SECRET` | Zapier + optional Sheets auth |
| `ZAPIER_INTEGRATION_USER_ID` | Optional send identity |
| `ZAPIER_INTEGRATION_USER_EMAIL` | Optional operator bypass |
| `SHEETS_WEBHOOK_SECRET` | Google Sheets contact import |
| `SHEETS_CONTACTS_IMPORT_TAGS` | Default tags on sheet import |
| `CRON_SECRET` | Vercel cron → `/api/cron/sync-twilio-history` |

---

## localStorage keys (client-only)

| Key | Purpose | Default |
|-----|---------|---------|
| `tav-sms:notify-sound` | Inbound sound enabled | `true` |
| `tav-inbox:desktop-notifications` | OS notifications when backgrounded | `true` |
| `tav-inbox-sidebar-collapsed` | Main sidebar collapsed (`"true"`) | expanded |
| `tav-inbox-thread-list-collapsed` | Inbox thread list narrow mode | expanded |
| `tav-voice:calls-last-seen-at` | ISO timestamp for missed-call badge | unset |

Inbox rail order/visibility uses additional keys via `use-inbox-rail-layout.ts` (per-user, device-local).

---

## Custom DOM events

| Event | Purpose |
|-------|---------|
| `tav-open-search` | Open global search modal |
| `tav-open-bug-report` | Open bug report modal |
| `tav-inbox-settings` | Open inbox info drawer; detail `{ inboxId }` |

---

## Webhook URLs (configure in Twilio Console)

| Path | Product |
|------|---------|
| `/api/twilio/conversations` | Conversations |
| `/api/twilio/inbound` | Classic SMS (if used) |
| `/api/twilio/status` | Message status |
| `/api/twilio/voice/inbound` | Voice inbound |
| `/api/twilio/voice/outbound-twiml` | Browser outbound |
| `/api/twilio/voice/status` | Call status |

Full URL: `https://tav-communication.vercel.app` + path (or `TWILIO_WEBHOOK_PUBLIC_URL`).

---

## Service worker

**File:** `web/public/inbox-alerts-sw.js` — registered for background SMS notifications.

---

## Related documents

- [twilio-integration-map.md](./twilio-integration-map.md)
- [keyboard-shortcuts-and-events.md](./keyboard-shortcuts-and-events.md)
