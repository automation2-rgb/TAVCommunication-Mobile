# Integrations and automation

External systems that connect to TAV Communication — Zapier, Google Sheets, cron sync, and bug reports.

---

## Zapier messaging

**Route:** `POST /api/integrations/zapier/messages`  
**Auth:** Shared secret (`ZAPIER_INTEGRATION_SECRET`) via headers:

- `X-Zapier-Secret`
- `X-Webhook-Secret`
- `Authorization: Bearer <secret>`

Verification: timing-safe compare in `lib/integrations/zapier-secret.ts`

### Capabilities

- Send SMS/MMS using **same libraries as UI** (`sendDirect1To1ViaConversations`, group send)
- Resolve/create threads via Zapier-specific helpers
- Set thread custom fields via `zapier-thread-fields`

### Identity for sends

- Uses configured integration user or first inbox member with `can_send=true`
- Optional env: `ZAPIER_INTEGRATION_USER_ID`, `ZAPIER_INTEGRATION_USER_EMAIL`

### Typical automation flow

1. External trigger (CRM, form, etc.)
2. Zapier POSTs to messages endpoint with inbox, to, body, optional media
3. Server validates secret + resolves thread
4. Message appears in inbox like UI send

---

## Zapier contacts

**Route:** `POST /api/integrations/zapier/contacts`  
**Auth:** Same shared secret

Upserts contacts into org directory — same data model as manual contacts.

---

## Google Sheets contacts import

**Route:** `POST /api/integrations/google-sheets/contacts`  
**Auth:** `SHEETS_WEBHOOK_SECRET` and/or `ZAPIER_INTEGRATION_SECRET`

### Auth methods

- Headers (preferred)
- JSON body `shared_secret` (Apps Script workaround)

### Behavior

- Bulk upsert contacts from sheet rows
- Merges default tags from `SHEETS_CONTACTS_IMPORT_TAGS` env (default: `company:texas auto value,source:google_sheets`)
- Empty env string = no default tags (only per-row tags)

### Setup

Documented in ops runbook `docs/operations/GOOGLE_SHEETS_CONTACTS_SYNC.md` (local/gitignored).

---

## Twilio history sync (cron)

**Route:** `GET /api/cron/sync-twilio-history`  
**Auth:** `CRON_SECRET` via:

- `Authorization: Bearer <secret>`
- Query `?secret=`
- Header `x-cron-secret`

### Purpose

Backfill `threads` and `messages` from Twilio REST API for configured phone numbers.

### Schedule

Vercel Cron in production (see `web/vercel.json`).

### Manual run

From `web/`:

```bash
npm run sync-twilio-history
npm run sync-twilio-history -- --dry-run
```

Uses `TWILIO_SYNC_DAYS` (default 90) for lookback window.

---

## Bug reports

**Route:** `POST /api/bug-reports`  
**Auth:** Approved user session

### User procedure

1. Click bug icon in workspace shell (or trigger `tav-open-bug-report` event)
2. `BugReportModal` opens
3. User enters description (required, max **8000** chars)
4. Optional attachments: max **5** files, **10 MB** each — images, PDF, plain text
5. Auto-attached: page URL, user agent
6. POST creates `bug_reports` row + optional Storage upload

### Modal layout

- Desktop: centered dialog
- Mobile: bottom sheet

Full spec: [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

### Operator review

Dev console **Bugs** tab — client read of `bug_reports` table.

---

## Twilio webhooks (inbound automation)

Not user-initiated but part of automation surface:

| Route | Trigger |
|-------|---------|
| `/api/twilio/conversations` | Twilio Conversations events |
| `/api/twilio/inbound` | Classic SMS |
| `/api/twilio/status` | Delivery status |
| `/api/twilio/voice/*` | Voice events |

See [twilio-integration-map.md](../reference/twilio-integration-map.md).

---

## Custom fields (Zapier + API)

Thread custom fields accessible via API for automation:

- `GET/PATCH /api/threads/[threadId]/custom-fields`
- Inbox schema: `/api/inboxes/[inboxId]/custom-field-definitions`

**Not shown in inbox UI** on master — automation-only.

Legacy thread properties (VIN, etc.) are separate and **are** in side panel UI.

---

## Security patterns

| Integration | Protection |
|-------------|------------|
| Zapier/Sheets | Shared secret, timing-safe compare |
| Twilio | HMAC signature on raw body |
| Cron | CRON_SECRET |
| Bug reports | Approved session + RLS |

Wrong secret → 401/403. Invalid Twilio signature → rejected.

---

## Environment variables (integrations)

```
ZAPIER_INTEGRATION_SECRET=
ZAPIER_INTEGRATION_USER_ID=          # optional
ZAPIER_INTEGRATION_USER_EMAIL=       # optional
SHEETS_WEBHOOK_SECRET=               # optional
SHEETS_CONTACTS_IMPORT_TAGS=         # optional
CRON_SECRET=                         # Vercel cron
TWILIO_WEBHOOK_PUBLIC_URL=           # proxy signature fix
```

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Zapier wrong inbox | Validation error |
| Sheets body secret | Supported for Apps Script; avoid logging secret |
| Cron without secret | 401 |
| Duplicate Twilio webhook | Idempotent on message SID |
| Bug report without attachment | Description-only row |
| Integration user lacks inbox access | Resolution falls back per env/config |

---

## Key files

| File | Role |
|------|------|
| `api/integrations/zapier/messages/route.ts` | Zapier send |
| `api/integrations/zapier/contacts/route.ts` | Zapier contacts |
| `api/integrations/google-sheets/contacts/route.ts` | Sheets import |
| `api/cron/sync-twilio-history/route.ts` | Cron backfill |
| `lib/integrations/zapier-secret.ts` | Secret verification |
| `lib/integrations/parse-zapier-request-body.ts` | Body parsing |
| `lib/twilio-history-sync.ts` | Backfill logic |
| `components/bug-report-modal.tsx` | Bug UI |

---

## Related documents

- [twilio-integration-map.md](../reference/twilio-integration-map.md)
- [api-routes-index.md](../reference/api-routes-index.md)
- [10-developer-admin-console.md](./10-developer-admin-console.md)
- [06-search-snippets-side-panel.md](./06-search-snippets-side-panel.md)
