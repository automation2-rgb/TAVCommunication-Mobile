# Voice calls

Browser-based calling via Twilio Programmable Voice — outbound from inbox threads, inbound ringing (pilot), and call history.

---

## Scope on master

| Feature | Scope |
|---------|-------|
| **Call history** (`/calls`) | All voice-enabled inboxes/lines |
| **Inbound browser ringing** | **Pilot only:** Transportation QA (`+17435000019`) |
| **Ring assignment UI** | Dev console — Transportation QA members |
| **Outbound from inbox** | Any 1:1 thread where inbox has Twilio number + user has send access |
| **Missed call badge** | All lines — inbound missed/no-answer/busy |

**Ops note:** Only Transportation QA has production Voice webhooks fully configured on master; other 8 lines may still log calls when voice-enabled.

---

## Call history page (`/calls`)

**Access:** All approved users  
**Components:** `calls-history-panel.tsx`, `calls-page-track-seen.tsx`

### Layout

- Table columns: When, Inbox, Direction, Contact, Agent, Status, Duration, Thread link
- Missed inbound rows highlighted **amber**
- Status pills color-coded
- Header notes inbound rings configured in dev dashboard

### Data load

- Server: up to **200** rows from `call_logs` via service role (`listPilotCallLogs` — name is historical; loads all lines)
- No client API on page itself

### Mark seen procedure

1. User visits `/calls`
2. `CallsPageTrackSeen` writes timestamp to `localStorage` (`tav-voice:calls-last-seen-at`)
3. Triggers refresh of missed-call nav badge

### Thread link column

- If `call_logs.thread_id` set → link to `/inbox?inbox=…&thread=…`
- Else em dash

---

## Outbound call from inbox

**UI:** `thread-voice-call-controls` on **direct (1:1) threads only**

### User procedure

1. Open 1:1 thread with customer
2. Click call button
3. Browser requests microphone permission (first time)
4. Client obtains token and initiates call

### Technical flow

```
1. GET /api/voice/token → Twilio Voice access token
2. POST /api/voice/outbound { inbox_id, thread_id, customer_e164 }
   → validates approved user + userCanSendInbox
   → returns connectParams
3. Twilio Voice SDK connects outbound call
4. Twilio hits POST /api/twilio/voice/outbound-twiml for TwiML
5. On answer: POST /api/voice/answered { call_sid } → sets agent_user_id on call_logs
6. Status webhooks → POST /api/twilio/voice/status → updates call_logs
```

### Constraints

- **1:1 threads only** — no group thread calling
- Inbox must have `twilio_phone_e164`
- User must have send access to inbox
- One active inbound/outbound at a time — second inbound rejected while call active

---

## Inbound call (pilot)

**UI:** `incoming-voice-call-modal` — global modal over workspace

### Ring procedure

1. Customer calls Transportation QA number
2. Twilio `POST /api/twilio/voice/inbound`
3. TwiML dials assigned agents from `inbox_call_assignments`
4. Assigned agents’ browsers ring (Voice SDK incoming)
5. Agent **Accept** or **Decline**

### On accept

- Call connects in browser
- `POST /api/voice/answered` tags agent on `call_logs`
- Modal closes; in-call UI shown

### On decline / timeout

- Call may go to next agent or end (TwiML config)
- Status → missed/no-answer in `call_logs`

### Ring assignment configuration

Operators: dev console **Call routing** tab

- Checkbox grid of approved Transportation QA inbox members
- `PUT /api/dev-console/voice-pilot/call-assignments`
- Validates users are approved members of pilot inbox

---

## Missed call badge

**API:** `GET /api/dev-console/voice-pilot/missed-count?since=<iso>`  
**Auth:** All approved users

Counts inbound calls with status missed/no-answer/busy since last `/calls` visit.

Displayed on **Calls** nav item in sidebar.

---

## Call log statuses

| Status | Meaning |
|--------|---------|
| `ringing` | In progress setup |
| `in-progress` | Connected |
| `completed` | Normal hangup |
| `missed` | Not answered |
| `no-answer` | Timeout |
| `busy` | Busy signal |
| `failed` | Error |

---

## Twilio Voice webhooks

| Route | Purpose |
|-------|---------|
| `POST /api/twilio/voice/inbound` | Initial inbound TwiML |
| `POST /api/twilio/voice/inbound-dial-complete` | Dial result |
| `POST /api/twilio/voice/outbound-twiml` | Browser outbound TwiML |
| `POST /api/twilio/voice/status` | Call status → DB |

All signature-validated like SMS webhooks.

---

## Environment requirements

```
TWILIO_API_KEY_SID
TWILIO_API_KEY_SECRET
TWILIO_TWIML_APP_SID  → Voice Request URL = {origin}/api/twilio/voice/outbound-twiml
```

Separate from Conversations SMS env vars.

---

## Incoming call modal (UI)

| Element | Style / behavior |
|---------|------------------|
| Overlay | Full-screen |
| Decline | Zinc button |
| Accept | Emerald; “Allow mic…” while connecting |
| Mic blocked | Warning banner |

**File:** `incoming-voice-call-modal.tsx`

---

## In-call controls (after connect)

Header chip on 1:1 thread — **not** the incoming modal:

- Elapsed timer
- Mute / unmute
- Hang up

**File:** `thread-voice-call-controls.tsx`

See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

---

## Call history page shell

- Wrapper: `AccountPageShell` on `bg-zinc-50`
- Content: `max-w-5xl`
- Empty table: “No calls logged yet.”

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Service role missing on /calls | Error banner, empty table |
| No thread linked | Thread column shows — |
| Second inbound while on call | Rejected |
| User not in ring assignments | Does not ring for inbound pilot |
| Non-pilot line inbound | May not ring browsers; may still log if webhooks configured |
| Microphone denied | Outbound/inbound browser call fails — browser UI error |
| Pilot inbox phone mismatch in DB | Call-assignments API 404/500 |

---

## Key files

| File | Role |
|------|------|
| `calls-history-panel.tsx` | History table |
| `incoming-voice-call-modal.tsx` | Inbound UI |
| `thread-voice-call-controls.tsx` | Outbound button |
| `lib/voice/use-twilio-voice.ts` | Voice SDK hook |
| `lib/voice/pilot-inbox.ts` | Pilot constants |
| `lib/voice/list-pilot-call-logs.ts` | SSR data |
| `inbox-call-assignments-panel.tsx` | Dev console routing |

---

## Related documents

- [twilio-integration-map.md](../reference/twilio-integration-map.md)
- [10-developer-admin-console.md](./10-developer-admin-console.md)
- [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md)
