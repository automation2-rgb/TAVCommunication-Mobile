# Contacts directory

Org-wide contact management and compose-to-text flows.

**Page:** `/contacts`  
**Components:** `contacts-directory.tsx` (client), SSR in `page.tsx`

---

## Purpose

- Browse, search, create, edit, delete contacts
- Organize **bundles** (saved contact groups)
- Text a contact or teammate from directory
- Live updates when contacts change (Realtime)

**Access:** All approved users. Data is **org-wide** (not inbox-scoped).

---

## Page layout — three tabs

**File:** `contacts-directory.tsx`

Pill tab switcher at top:

| Tab | Label | Contents |
|-----|-------|----------|
| `external` | **External** | Customer contacts — search, tag filter (`?tags=`), sort, infinite browse, add/edit/delete modals |
| `team` | **Team** | Approved teammates — role labels, message in app, text phone |
| `saved_groups` | **Saved groups** | Contact bundles — create/edit/delete, member phone lists |

Empty copy examples: “No external contacts yet…” / no search results.

**Realtime:** Debounced 350ms refresh on `contacts` table changes.

---

## Start chat / text from team

- **Text teammate:** `StartChatFromTeamModal` — pick sendable inbox → compose deep link
- **Message in app:** `/chat?user=` from team tab or `/team/[userId]`

---

## Page layout (legacy summary)

```
┌─────────────────────────────────────────────────────────┐
│ Header: Contacts                                        │
├─────────────────────────────────────────────────────────┤
│ Search bar + tag filter + sort controls                 │
├─────────────────────────────────────────────────────────┤
│ Contact list (paginated / search results)               │
│   - Name, phone, tags, actions                        │
├─────────────────────────────────────────────────────────┤
│ Team section (quick text to teammates)                  │
├─────────────────────────────────────────────────────────┤
│ Bundles section                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Browse contacts (initial load)

### Server-side

1. `requireApprovedMessagingUser()`
2. First keyset page via RPC `list_contacts_directory_page`
3. Also loads team members and inboxes for compose actions

### Client-side browse

- Keyset pagination for scrolling through directory
- Sort options: phone, name, updated (client RPC `query_contacts_directory`)

---

## Search contacts

1. User types in search field (name or phone)
2. Client calls `queryContactsDirectory` Supabase RPC
3. Returns up to **500** matches
4. URL may include `?search=` param (remounts directory component)

**Note:** Initial SSR page is browse-only; search narrowing happens client-side.

---

## Create contact

1. Click **Add contact** (or equivalent)
2. Modal: display name, phone (E.164), notes, tags
3. Insert via Supabase browser client (RLS)
4. Realtime updates list for all users

---

## Edit contact

1. Click contact row → edit modal
2. Update fields via Supabase client
3. Changes sync via Realtime subscription on `contacts` table

---

## Delete contact

1. Confirm deletion in UI
2. Delete via Supabase client
3. Related thread links may retain historical data (`threads.contact_id` nullable)

---

## Tags and filtering

- Contacts have `tags` array (lowercase strings)
- Filter dropdown narrows list by tag
- Google Sheets import merges default org tags (configurable via env)

---

## Contact bundles

**Purpose:** Saved groups of phone numbers for bulk reference (not the same as SMS group threads).

### Create bundle

1. Open bundle create UI
2. Name bundle + add member phones
3. Client validates E.164 on each member
4. Insert `contact_bundles` + `contact_bundle_members`
5. If member insert fails, bundle may be rolled back (deleted)

### Edit / delete bundle

- Edit name and members via modals
- Delete bundle removes members cascade

**RLS:** Org-wide for approved users — any teammate can edit any bundle.

---

## Compose SMS from contact

1. User clicks **Text** (or similar) on contact row
2. Navigate to `/inbox?compose=1&to=<e164>` with default inbox (typically first accessible or voice-default inbox from directory logic)
3. Inbox opens in compose mode with recipient pre-filled

---

## Team section

Lists approved teammates (from workspace team data):

- Quick action to text teammate’s `phone_e164` if set
- Links to `/team/[userId]` for profile

---

## Debug mode

URL: `/contacts?debug=contacts&find=<uuid>`

- Fetches single contact by UUID if not in first SSR page
- Development/troubleshooting only

---

## Data access pattern

**No dedicated REST API** for contacts UI — uses Supabase browser client + RPCs:

| Operation | Method |
|-----------|--------|
| Browse page | `list_contacts_directory_page` RPC |
| Search/filter | `query_contacts_directory` RPC |
| CRUD | Direct table ops on `contacts` |
| Bundles | `contact_bundles`, `contact_bundle_members` |

**Integration routes (not used by this page):**

- `POST /api/integrations/zapier/contacts`
- `POST /api/integrations/google-sheets/contacts`

---

## Realtime

Client subscribes to `contacts` postgres changes:

- INSERT/UPDATE/DELETE reflected in list without full reload
- Requires authenticated Supabase client

---

## UI details

- Contact rows show formatted phone (`formatPhoneNumber`)
- Tag chips with color coding
- Empty states for no contacts / no search results
- Loading skeletons during search
- Edit modal validates phone before save

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Invalid phone on save | Client validation error |
| Duplicate phone | DB unique constraint may error |
| Search > 500 results | Capped at RPC limit |
| URL search param change | Component remounts with new key |
| Contact linked to thread | Thread may show contact name via `contact_id` join |
| User without inboxes | Compose may land on empty inbox + access request panel |

---

## Key files

| File | Role |
|------|------|
| `contacts-directory.tsx` | Main UI |
| `lib/contacts/directory-query.ts` | RPC wrappers |
| `lib/contacts/recipient-picker-search.ts` | Shared search (also inbox picker) |
| `lib/contacts/upsert-from-thread.ts` | Auto-contact from inbound SMS |

---

## Related documents

- [02-inbox-and-direct-messaging.md](./02-inbox-and-direct-messaging.md)
- [05-team-profile-settings-help.md](./05-team-profile-settings-help.md)
- [11-integrations-and-automation.md](./11-integrations-and-automation.md)
