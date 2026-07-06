# Search, snippets, and side panel

Cross-cutting inbox features: global search, message snippets, and the conversation side panel.

---

## Global search

### Trigger

- **Keyboard:** ⌘K (Mac) / Ctrl+K (Windows)
- **UI:** Search icon in workspace shell / sidebar

**Component:** `search-modal.tsx`

### Search procedure

1. Modal opens with text input
2. **Empty query:** shows up to **5** “Recent in this inbox” threads
3. User types query — **API runs at ≥ 3 characters** (450ms debounce)
4. **UI note:** At 2 characters skeleton may show; prompt says “Type at least **3** characters…”
5. Results grouped by type:
   - **Threads** — display name / customer match (RPC `search_thread_ids_for_workspace`)
   - **Messages** — body text match (RPC `search_messages_for_workspace`)
   - **Contacts** — directory match; unknown numbers may show compose hits

### Selecting a result

| Result type | Navigation |
|-------------|------------|
| Thread | `/inbox?inbox=<id>&thread=<id>` |
| Message | Same + scroll/highlight to message ID — **2s blue ring** (`animate-search-highlight`); may load older pages until found |

Full search modal spec: [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).
| Contact / compose | `/inbox?compose=1&to=<e164>` |

### Scope

- Search spans **all inboxes user can access** (workspace-wide, not single inbox)
- Respects inbox membership RLS on server

### UI details

- Modal overlay with autofocus input
- Esc closes modal
- Empty state below 3 chars: prompt to type more
- Loading spinner during fetch
- Result rows show inbox name, snippet, timestamp context

---

## Message snippets

**Purpose:** Quick-insert reusable text templates in composer.

### Snippet sources (priority)

1. **Inbox-scoped** snippets (`message_snippets.inbox_id` matches current inbox)
2. **Legacy global** snippets (null inbox_id, not personal)
3. **Personal** snippets (`is_personal` for current user)

### Insert procedure

1. In composer, type `/` or `snippets` trigger
2. `ComposerSlashMenu` or `MessageSnippetsPicker` opens
3. User selects snippet
4. Body text inserted at cursor (may replace slash command token)

### Manage snippets

CRUD via Supabase browser client (`workspace-snippets-cache.ts`):

- Create/edit/delete from picker UI
- Fields: title, body, inbox scope, personal flag

**No REST API** for snippets — direct client + RLS.

### Slash menu

`composer-slash-menu.tsx` — may expose snippets and other composer commands.

---

## Conversation side panel

**Component:** `conversation-side-panel.tsx`  
**Visibility:** Desktop — third column; mobile — bottom sheet / drawer

### Sections (top to bottom)

#### 1. Display name

- Shows thread title or derived phone/contact name
- Inline edit → `PATCH /api/threads/[threadId]` `{ display_name }`

#### 2. Thread notes

- Free-text notes for the deal/conversation
- Save → same PATCH with `{ notes }`

#### 3. Thread properties (“deal properties”)

Legacy slugged fields (VIN, stock number, etc.):

- Loaded from `GET /api/threads/[threadId]/thread-properties`
- Auto-created default rows on first access (`thread-property-defaults.ts`)
- Edit inline → PATCH individual rows or POST new rows
- **Not** the same as `custom-fields` API (those are Zapier/admin only, not in UI)

#### 4. Directory contact notes (1:1 only)

- If thread linked to contact, show contact notes
- Edit → direct Supabase update on `contacts` table

#### 5. Participants (groups only)

- List from `group_participant_snapshot` + `thread_participants`
- E.164 formatted labels

#### 6. Links

- Open contact in `/contacts` when `contact_id` set

### Session refresh

Side panel fetches call `ensureBrowserSessionFresh()` before API requests — prevents stale session errors.

---

## Custom fields (API only — not in side panel UI)

Exists on master but **not rendered** in inbox:

| Endpoint | Purpose |
|----------|---------|
| `GET/PATCH /api/threads/[id]/custom-fields` | Per-thread values |
| `/api/inboxes/[id]/custom-field-definitions` | Schema CRUD (admin) |

Used by Zapier integration. Documented for parity if UI adds them later.

---

## Inbox settings drawer

**Informational only** — not inbox configuration. Explains thread properties are on the **Contact panel**.

Trigger: sidebar **SlidersHorizontal** → `tav-inbox-settings` event.  
See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

---

## Image lightbox

Gallery with prev/next, download, open in new tab (images), PDF iframe, Esc to close.  
See [modals-empty-states-and-overlays.md](../ui/modals-empty-states-and-overlays.md).

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Search < 3 chars | No API call |
| Search no results | Empty state in modal |
| Snippet in new compose | May appear in thread list preview for selected row |
| Side panel on group | No contact notes section |
| Property defaults race | Server creates defaults on first GET |
| Mobile side panel | Sheet overlay; conversation still visible behind |

---

## Key files

| File | Role |
|------|------|
| `search-modal.tsx` | Global search UI |
| `api/search/route.ts` | Search API |
| `message-snippets-picker.tsx` | Snippet picker |
| `composer-slash-menu.tsx` | Slash commands |
| `conversation-side-panel.tsx` | Side panel |
| `lib/messaging/snippet-command.ts` | Slash parsing |
| `lib/messaging/thread-custom-properties-server.ts` | Properties server logic |

---

## Related documents

- [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md)
- [04-contacts-directory.md](./04-contacts-directory.md)
- [11-integrations-and-automation.md](./11-integrations-and-automation.md)
