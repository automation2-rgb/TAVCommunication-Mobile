# Modals, empty states, sheets, and overlays

UI surfaces that appear on top of or instead of main content. All paths are on production `master`.

---

## Empty states (`EmptyState` component)

**File:** `web/components/empty-state.tsx`

Centered layout: icon in `rounded-full` circle + `text-lg font-semibold` title + `text-sm text-zinc-600` body.

| Variant | When shown | Title | Icon color |
|---------|------------|-------|------------|
| `no-threads` | Active tab, no threads | “No conversations yet” | zinc-200 / zinc-700 |
| `no-threads-history` | History-only inbox | “No phone number” | amber-100 / amber-600 |
| `no-archived-threads` | Done tab empty | “No done deals yet” | zinc-200 |
| `no-unread-threads` | Unread tab empty | “All caught up” | zinc-200 |
| `no-messages` | Thread open, zero messages | “Start the conversation” | emerald-100 / emerald-600 |
| `select-thread` | No thread selected | “Select a conversation” | zinc-100 |
| `no-inboxes-assigned` | **Defined but unused** — replaced by access panel | — | — |

**Filter → variant mapping** (inbox thread list): Active → `no-threads`; Unread → `no-unread-threads`; Done → `no-archived-threads`.

### All inboxes hidden (rail preferences)

Custom state (not `EmptyState`): user hid every inbox in Settings → inbox rail. Copy explains no visible inboxes; CTA link to `/settings#inbox-sidebar`.

**File:** `web/app/inbox/inbox-messenger.tsx`

---

## Request inbox access panel

**When:** User has zero `inbox_members` rows — full-page centered in inbox.

**File:** `web/components/request-inbox-access-panel.tsx`

| Element | Detail |
|---------|--------|
| Default title | “No inboxes assigned yet” |
| Default description | Pick inboxes; admin reviews in developer dashboard |
| Catalog | `GET /api/inbox-access/catalog` |
| Row badges | **Assigned** (member), **Requested** (pending request) — disabled checkboxes |
| Pending banner | “You have inbox requests awaiting review” |
| Error state | Red banner + **Retry** button |
| Footer | Selection count + **Request access** → `POST /api/inbox-access/request` |
| Icon | Amber inbox icon (non-compact mode) |

---

## Search modal

**File:** `web/components/search-modal.tsx`  
**Triggers:** Inbox header search button; **Ctrl/⌘+K**; custom event `tav-open-search`

| Behavior | Detail |
|----------|--------|
| Close | Esc, backdrop click, Ctrl/⌘+K again |
| **Recent threads** | Empty query: up to **5** recent threads in current inbox |
| **Min chars for API** | Query trimmed **≥ 3** → `GET /api/search?q=` (450ms debounce) |
| **UI at 2 chars** | Shows loading skeleton; “no results” possible before API runs |
| **UI below 3 chars** | Prompt: “Type at least **3** characters to search across all inboxes” |
| Result: thread | Navigate to thread |
| Result: message | Navigate with `messageId`; inbox scrolls/loads until found → **2s blue highlight** (`animate-search-highlight`) |
| Result: compose | “New message — matches Contacts (no thread yet)” → `/inbox?compose=1&to=` |
| Footer | Keyboard hint bar |

---

## Group creation modal (inbox)

**Inline in** `web/app/inbox/inbox-messenger.tsx` (~4920–5012)  
**Trigger:** Thread list **“New group chat”** (Users icon)

| Element | Detail |
|---------|--------|
| Title | “New group conversation” |
| Native Group MMS | Checkbox (default **on**) with explanatory copy |
| Recipients | `OutboundContactRecipientPicker` (multi) + Enter for raw E.164 |
| Saved groups | `ContactBundleQuickAdd` pills from contact bundles |
| Link | Open `/contacts` |
| Actions | Cancel / **Create group**; busy spinner; inline error |
| API | `POST /api/threads/group` |

---

## Bug report modal

**File:** `web/components/bug-report-modal.tsx`  
**Trigger:** User menu → Report a bug; mobile drawer; `tav-open-bug-report` event

| Field / rule | Detail |
|--------------|--------|
| Description | Required; max **8000** chars |
| Auto-captured | Current `page_url`, `user_agent` |
| Attachments | Optional; max **5** files, **10 MB** each; images, PDF, plain text |
| Flow | POST `/api/bug-reports` → Supabase Storage upload → `bug_report_attachments` rows |
| Success | Thank-you state; partial upload warning if storage fails |
| Layout | Desktop: centered modal; mobile: bottom sheet |

---

## Inbox settings drawer

**File:** `web/components/inbox-settings-drawer.tsx`  
**Trigger:** Sidebar inbox row → **SlidersHorizontal** → `tav-inbox-settings` event

**Important:** Informational only — **not** inbox configuration.

| Element | Detail |
|---------|--------|
| Title | “Inbox · {display_name}” |
| Content | Explains thread properties live on **Contact panel**, not here |
| Close | Back button, backdrop, Esc |
| Width | `min(100vw, 22rem)` slide from right |
| Desktop | Sets `rightPanelMode = "inbox-settings"` (replaces contact column) |

---

## Inbox selector sheet (mobile)

**File:** `web/components/inbox-selector-sheet.tsx`  
**Trigger:** Mobile inbox header inbox name tap

| Element | Detail |
|---------|--------|
| List | All accessible inboxes with unread counts |
| Selected row | `border-l-4 border-l-[var(--tav-bubble-out)]` |
| No number | Indicates history-only inbox |

---

## Conversation side panel (mobile sheet)

**Trigger:** Thread header **Contact** button on mobile  
**Width:** `w-[min(100%,24rem)]` slide from right  
**Body:** Same as desktop `ConversationSidePanelSheetBody`

---

## Message attachment lightbox

**File:** `web/components/message-attachment-lightbox.tsx`  
**Gallery:** `web/lib/messaging/thread-attachment-gallery.ts`

| Type | Behavior |
|------|----------|
| Images | Full view; **Download** + **Open in new tab** |
| PDF | Inline iframe |
| Other | “Preview not available” + Open file link |
| Navigation | Prev/next arrows; counter “n of m”; Esc; backdrop click |
| Scroll | Body scroll locked while open |

Also used in internal chat via `ChatAttachmentLightboxHost` on message bubbles.

---

## Incoming voice call modal

**File:** `web/components/incoming-voice-call-modal.tsx`

| Element | Detail |
|---------|--------|
| Layout | Full-screen overlay |
| Caller ID | Formatted E.164 / contact name |
| Decline | Zinc button |
| Accept | Emerald button; shows “Allow mic…” while connecting |
| Mic blocked | Warning from `getMicrophoneDeniedMessage()` |

---

## In-call controls (after connect)

**File:** `web/components/thread-voice-call-controls.tsx`  
**Location:** Thread conversation header (not the incoming modal)

| Control | Detail |
|---------|--------|
| Call button | Starts outbound when idle |
| In-call chip | Elapsed time (`formatVoiceElapsed`) |
| Mute / unmute | Mic icons |
| Hang up | Red phone-off |
| Hidden | When inbox has no voice line |

---

## Incoming SMS toast (focused tab)

Custom **Sonner** toast (~6s) when inbound arrives on a **non-open** thread while tab is focused.  
Tappable card navigates to thread.  
**File:** `web/app/inbox/inbox-messenger.tsx`

---

## Jump to latest FAB

Floating pill at bottom of message list when user scrolled up and new messages exist.

```
rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-md
Label: "New message" + ArrowDown icon
```

---

## Remove from inbox confirm

Thread row **⋮** menu → remove/archive confirm → marks thread Done (`POST .../hide`).  
**File:** `web/app/inbox/inbox-messenger.tsx`

---

## Chat modals and panels

| Surface | File | Purpose |
|---------|------|---------|
| New conversation | `chat-new-conversation-modal.tsx` | Start DM or group |
| Group info | `chat-group-info-panel.tsx` | Rename, add members, leave |
| Start chat from team | `start-chat-from-team-modal.tsx` | Pick inbox to SMS teammate |

---

## Dev console message detail

**Desktop:** Right column panel  
**Mobile:** Bottom sheet  
**File:** `web/app/admin/dashboard/message-detail-modal.tsx`

Triage category, operator note, ack flag, local status override (when no Twilio SID), Twilio diag link, raw payload viewer.

---

## Account page shell

**File:** `web/components/account-page-shell.tsx`

Used by profile, settings, help, calls, onboarding-family pages:

- `bg-zinc-50` full page
- White header with `TavBrandLink` + optional back link
- `max-w-2xl` centered content
- `text-2xl font-semibold` page title

**Note:** Login alone uses **dark** `zinc-950` theme. Onboarding, pending-approval, and account-rejected use this **light** shell.

---

## Related documents

- [workspace-layout-and-navigation.md](./workspace-layout-and-navigation.md)
- [flows/02-inbox-and-direct-messaging.md](../flows/02-inbox-and-direct-messaging.md)
- [flows/06-search-snippets-side-panel.md](../flows/06-search-snippets-side-panel.md)
