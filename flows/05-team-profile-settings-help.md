# Team, profile, settings, and help

Supporting workspace pages for user identity, preferences, and teammate interaction.

---

## Team profile (`/team/[userId]`)

**Purpose:** View an approved teammate’s profile and start a conversation.

### Access

- Any **approved** user
- Target must be **approved** profile — otherwise `notFound()`
- Invalid UUID → `notFound()`

### Page content

| Element | Source |
|---------|--------|
| Avatar | Initials from display name |
| Display name | `profiles.display_name` |
| Email | Read-only |
| Role | `profiles.role` (admin/member) |
| Mobile | `profiles.phone_e164` |

### Actions

| Button | Condition | Result |
|--------|-----------|--------|
| **Message in app** | Not self; other user approved | Navigate to `/chat?user=<uuid>` |
| **Text their phone** | Has `phone_e164` | Modal → pick inbox → `/inbox?compose=1&to=…` |
| **View your profile** | Self only | Link to `/profile` |

**Hidden for self:** In-app message CTA (use profile instead).

### UI layout

- Card-style profile header
- Action buttons below metadata
- Back navigation to previous page / sidebar team list

### Edge cases

| Scenario | Behavior |
|----------|----------|
| Pending teammate UUID | 404 |
| No phone on profile | SMS button disabled |
| Deep link to chat | See [09-internal-chat.md](./09-internal-chat.md) |

**No `/team` index** — reach via sidebar team avatars only.

---

## Profile (`/profile`)

**Purpose:** Edit own display name and mobile number.

### Fields

| Field | Editable |
|-------|----------|
| Email | No (Google auth) |
| Display name | Yes |
| Mobile (E.164) | Yes |
| Role | Display only — “assigned by administrator” |

### Save procedure

1. User edits fields
2. Submit → Supabase client update on own `profiles` row (`eq id = userId`)
3. Toast on success/error

### Validation

- Phone must pass `isE164()` or toast error, no save
- Empty display name stored as `null`

**No API route** — direct Supabase RLS update.

---

## Settings (`/settings`)

**Purpose:** Device-local preferences and inbox rail customization.

### Sections

#### Desktop notifications

- Toggle enable/disable (`localStorage`)
- **Request permission** button triggers browser `Notification.requestPermission()`
- Shows current permission state (granted/denied/default)
- Guidance when denied (browser settings)

#### Notification sounds

- Toggle inbound sound on/off (`localStorage`)
- Sound file: `/notification.mp3`
- Primed on first user gesture (`primeMessageSoundOnUserGesture`)

#### Inbox rail preferences

`InboxRailPreferencesPanel` (section id **`inbox-sidebar`**, anchor `/settings#inbox-sidebar`):

- Reorder inboxes in left rail (drag or controls)
- Show/hide inboxes from rail
- Stored per-user in **localStorage** (not synced across devices)
- Inbox links here when user hides all inboxes from rail

#### Account links

- Link to `/profile`
- Link to `/help`

### Data persistence

| Preference | Storage |
|------------|---------|
| Desktop notifications | `localStorage` via `lib/settings/local-preferences.ts` |
| Notify sound | `localStorage` |
| Inbox rail order/visibility | `localStorage` via `use-inbox-rail-layout.ts` |

**Not on settings page:** Inbox access requests — shown in inbox empty state instead (`RequestInboxAccessPanel`).

---

## Help (`/help`)

**Purpose:** Static in-app documentation for approved users.

### Content topics

| Topic | Details |
|-------|---------|
| Keyboard shortcuts | ⌘/Ctrl+K search, Enter send, Esc close modals |
| SMS length | 1600 character limit note |
| Receiving messages | Explains inbound flow |
| Quick links | Settings, profile, inbox |

**No dynamic state** — pure static JSX after auth gate.

---

## Inbox access request (related flow)

Shown on `/inbox` when user has **no inbox memberships** (not on settings page).

### Procedure

1. Panel lists inboxes from `GET /api/inbox-access/catalog`
2. User selects inboxes and submits
3. `POST /api/inbox-access/request`
4. Operator assigns via dev console

---

## Sidebar team avatars

`InboxSidebar` shows teammate avatars linking to `/team/[userId]`:

- Data from workspace cached team list
- Only approved teammates shown

---

## UI patterns shared across these pages

- `AccountPageShell` or similar page wrapper with title
- Consistent max-width content column
- Mobile-responsive padding
- Breadcrumb/back where applicable

---

## Edge cases

| Scenario | Behavior |
|----------|----------|
| Notifications denied | Settings shows reset instructions; in-tab toast may still work |
| Rail prefs on new device | Default order until user customizes |
| Profile phone used for voice | Outbound caller ID matching depends on Twilio config |
| Role change | Not available in profile UI — operator/DB only |

---

## Key files

| File | Role |
|------|------|
| `teammate-view.tsx` | Team profile |
| `profile-form.tsx` | Profile editor |
| `settings-preferences.tsx` | Settings UI |
| `help/page.tsx` | Help content |
| `request-inbox-access-panel.tsx` | Inbox access |
| `start-chat-from-team-modal.tsx` | SMS from team page |
| `lib/settings/local-preferences.ts` | Notification prefs |

---

## Related documents

- [01-auth-and-onboarding.md](./01-auth-and-onboarding.md)
- [09-internal-chat.md](./09-internal-chat.md)
- [07-notifications-realtime-polling.md](./07-notifications-realtime-polling.md)
