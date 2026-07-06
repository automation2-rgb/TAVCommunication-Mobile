# TAV Communication — Web App Context

Documentation describing **how the current TAV Communication web application works** on production `master`. Use this as the source of truth for product behavior, UI/UX, backend contracts, and edge cases.

**Production URL:** https://tav-communication.vercel.app/

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres + Realtime + Storage) · Twilio (Conversations SMS/MMS + Programmable Voice)

**Same backend for all clients:** Supabase project `wiacdfruipunzfffgyfy`, Twilio account, Vercel-hosted API routes under `/api/*`.

---

## Document map

### Reference (read first for cross-cutting concepts)

| Document | Contents |
|----------|----------|
| [reference/user-roles-and-permissions.md](./reference/user-roles-and-permissions.md) | Identity layers, roles, gates, who can do what |
| [reference/data-model.md](./reference/data-model.md) | Supabase tables, relationships, RLS patterns, RPCs |
| [reference/twilio-integration-map.md](./reference/twilio-integration-map.md) | SMS/MMS/voice paths, webhooks, env vars |
| [reference/api-routes-index.md](./reference/api-routes-index.md) | All 47 API routes with auth requirements |
| [reference/environment-and-client-storage.md](./reference/environment-and-client-storage.md) | Env vars, localStorage keys, webhooks, service worker |
| [reference/keyboard-shortcuts-and-events.md](./reference/keyboard-shortcuts-and-events.md) | Shortcuts, composer keys, custom DOM events |

### UI and design

| Document | Contents |
|----------|----------|
| [ui/workspace-layout-and-navigation.md](./ui/workspace-layout-and-navigation.md) | Layout, navigation, color palette, typography, buttons, bubbles |
| [ui/modals-empty-states-and-overlays.md](./ui/modals-empty-states-and-overlays.md) | Empty states, modals, sheets, lightbox, voice overlay, toasts |

### User flows (procedures)

| Document | Contents |
|----------|----------|
| [flows/01-auth-and-onboarding.md](./flows/01-auth-and-onboarding.md) | Login, domain gate, onboarding, approval, rejection |
| [flows/02-inbox-and-direct-messaging.md](./flows/02-inbox-and-direct-messaging.md) | Inbox UI, 1:1 threads, compose, send, read state, Done |
| [flows/03-group-messaging.md](./flows/03-group-messaging.md) | App group vs native group MMS, create, send, delivery |
| [flows/04-contacts-directory.md](./flows/04-contacts-directory.md) | Contact CRUD, bundles, search, compose from contact |
| [flows/05-team-profile-settings-help.md](./flows/05-team-profile-settings-help.md) | Team view, profile, settings, help, inbox access requests |
| [flows/06-search-snippets-side-panel.md](./flows/06-search-snippets-side-panel.md) | Global search, snippets, conversation side panel |
| [flows/07-notifications-realtime-polling.md](./flows/07-notifications-realtime-polling.md) | Alerts, sounds, service worker, Realtime, polling |
| [flows/08-voice-calls.md](./flows/08-voice-calls.md) | Browser calling, call history, pilot routing |
| [flows/09-internal-chat.md](./flows/09-internal-chat.md) | Staff DMs/groups, attachments, reactions, voice notes |
| [flows/10-developer-admin-console.md](./flows/10-developer-admin-console.md) | Dev dashboard, user approvals, message triage, call routing |
| [flows/11-integrations-and-automation.md](./flows/11-integrations-and-automation.md) | Zapier, Google Sheets, cron sync, bug reports |

---

## Coverage checklist (master)

| Area | Primary docs |
|------|----------------|
| Auth / login / onboarding / pending / rejected | 01, ui/modals |
| User menu / sign out / mobile drawer | ui/workspace, ui/modals |
| Inbox 1:1 / compose / Done / read state | 02 |
| Group MMS / app group / create modal | 03, ui/modals |
| Contacts tabs / bundles / team SMS | 04, 05 |
| Profile / settings / help / rail prefs | 05, ui/workspace |
| Search / snippets / side panel / inbox info drawer | 06, ui/modals |
| Notifications / Realtime / polling / SW | 07 |
| Voice / incoming modal / in-call / calls table | 08, ui/modals |
| Internal chat / reactions / attachments | 09 |
| Dev console / approvals / triage / routing | 10 |
| Zapier / Sheets / cron / bug reports | 11 |
| Roles / RLS / data model | reference/* |
| Twilio paths / webhooks | reference/twilio-integration-map |
| Design tokens / buttons / layout sizes | ui/workspace |
| Empty states / modals / lightbox | ui/modals |
| Env / localStorage / events | reference/environment, reference/keyboard |

---

## Product summary

**TAV Communication** (internally “TAV Inbox”) is Texas Auto Value’s org SMS workspace. Approved staff sign in with Google (`@texasautovalue.com`), access one or more **inboxes** (Twilio phone lines), and send/receive SMS and MMS with customers and teammates.

Additional surfaces on `master`:

- **Contacts** — org-wide directory with tags and saved groups (bundles)
- **Voice** — browser-based calling (pilot on Transportation QA line; history for all voice-enabled lines)
- **Internal chat** — in-app staff messaging (no Twilio; Supabase only)
- **Developer console** — operator-only tools embedded at `/inbox?dev=1`

---

## Eight production inboxes

| Slug | Display name |
|------|--------------|
| `wires-only-only` | Wires Only Only |
| `inspection-approval` | Inspection Approval |
| `titles-collections` | Titles & Collections |
| `scheduling` | Scheduling |
| `wires-accounting` | Wires & Accounting |
| `transporter-scheduling` | Transporter Scheduling |
| `inventory-control` | Inventory Control |
| `transportation-qa` | Transportation QA |

Voice pilot inbound ringing is configured for **Transportation QA** (`+17435000019`) only. Other lines may still log outbound/inbound call history when voice is enabled on those numbers.

---

## Key source paths (web app)

| Area | Path in repo |
|------|--------------|
| Next.js app | `web/` |
| Main inbox UI | `web/app/inbox/inbox-messenger.tsx` |
| Workspace shell | `web/components/workspace-shell.tsx` |
| Auth gates | `web/lib/auth/` |
| Messaging libs | `web/lib/messaging/` |
| Twilio libs | `web/lib/twilio/` |
| Chat libs | `web/lib/chat/` |
| Voice libs | `web/lib/voice/` |
| SQL mirrors (tracked) | `tools/sql/` |

---

## Intentionally excluded

| Item | Reason |
|------|--------|
| `/dev/send` | Local dev smoke test only — `notFound()` in production |
| `origin/TAV2` branch | Not on `master` (persistent panels refactor) |
| Raw SQL migration files | Local/gitignored; use `tools/sql/` mirrors + deployed schema |
| Pixel-perfect screenshots | Docs derived from code; add screenshots manually if needed |

---

*Baseline: `master` branch. Generated from codebase analysis.*
