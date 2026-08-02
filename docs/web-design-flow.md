# Design flow — TAV Inbox (web)

**Purpose:** Self-contained visual and UX reference for the production web app at `https://tav-communication.vercel.app/`. Use this document to reproduce the same look and feel in another client (e.g. mobile). It describes **design only** — layout, colors, typography, components, states, and interactions as implemented on `master` — not backend APIs.

**Source of truth:** Next.js app in `web/` — primarily Tailwind CSS utility classes + CSS variables in `web/app/globals.css`.

---

## 1. Design philosophy

The product is an **internal org SMS workspace** (Texas Auto Value) with add-ons for **browser voice calling** and **in-app team chat**. Visually it follows an **iOS-style messaging** aesthetic:

- Light mode only in production UI
- White thread canvas, grouped gray composer strip (`#f2f2f7`)
- Blue outbound bubbles (`#0a84ff`), gray inbound bubbles (`#e5e5ea`)
- Zinc/gray chrome for navigation, borders, and secondary text
- Red brand accent for user avatar circles and login/marketing surfaces
- Lucide icons throughout (stroke icons, typically 16–20px in nav, 20px in headers)

Interaction patterns:

- Buttons scale to **0.985** on press (global CSS)
- Rounded corners everywhere (`rounded-lg`, `rounded-xl`, `rounded-full` for pills/avatars)
- Subtle shadows on cards and composer focus
- Staggered **fade-in** on thread list rows; **pane swish** when switching conversation content
- Mobile uses **full-screen sliding panels** for thread list ↔ conversation (not side-by-side)

---

## 2. Design tokens

### 2.1 CSS custom properties (`globals.css`)

| Token | Value | Usage |
|-------|-------|--------|
| `--tav-chat-canvas` | `#ffffff` | Message thread background |
| `--tav-composer-slab` | `#f2f2f7` | Composer area behind input (iOS grouped background) |
| `--tav-bubble-out` | `#0a84ff` | Outbound bubble fill, send button, chat unread badges |
| `--tav-bubble-out-hover` | `#0b76e8` | Send button hover |
| `--tav-bubble-in` | `#e5e5ea` | Inbound bubble fill |
| `--tav-bubble-in-text` | `#000000` | Inbound bubble text |
| `--tav-bubble-out-dim` | `rgba(255,255,255,0.72)` | Timestamp/status on outbound bubbles |
| `--tav-messaging-link` | `#0a84ff` | Links, draft labels, accent text, unread ring on inbox icons |

Outbound bubble gradient (utility class `bg-tav-bubble-out-gradient`):

```
linear-gradient(180deg, #3498ff 0%, #0a84ff 42%, #107eef 100%)
```

Semantic RGB tokens (used sparingly):

| Token | Tailwind equivalent | Usage |
|-------|---------------------|--------|
| `--primary` | blue-600 | Focus rings on inputs |
| `--success` | green-600 | Delivered checkmarks (inbound) |
| `--warning` | amber-500 | Missed calls, pending approvals |
| `--error` | red-600 | Failed messages, destructive actions |

### 2.2 Typography

| Element | Font | Notes |
|---------|------|--------|
| Body | **Geist Sans** (`--font-geist-sans`) | Loaded via `next/font/google`; `antialiased` on `<html>` |
| Monospace | Geist Mono | Phone numbers in tables, debug |
| Inbox messenger override | System UI stack | `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` on the main inbox container |

**Size scale (common):**

| Role | Classes | Approx |
|------|---------|--------|
| Page title | `text-2xl font-semibold tracking-tight text-zinc-900` | 24px |
| Section title (inbox header desktop) | `text-lg font-semibold text-zinc-900` | 18px |
| Thread list name | `font-semibold` / unread: `font-bold text-zinc-950` | 14px context |
| Message body | `text-base leading-relaxed` | 16px |
| Composer input | `text-sm leading-relaxed` | 14px |
| Metadata / timestamps | `text-xs` or `text-[10px]` / `text-[11px]` | 10–12px |
| Nav section labels | `text-[11px] font-semibold uppercase tracking-wide text-zinc-400` | 11px caps |

### 2.3 Color palette (Tailwind zinc + accents)

| Role | Classes |
|------|---------|
| App background (non-inbox routes) | `bg-zinc-50` |
| Inbox main area | `bg-white` |
| Thread list column | `bg-[#f8f8f8]` |
| Borders | `border-zinc-200`, lighter: `border-zinc-100`, `border-zinc-50` |
| Primary text | `text-zinc-900` |
| Secondary text | `text-zinc-600`, `text-zinc-500` |
| Muted / placeholder | `text-zinc-400` |
| Hover surfaces | `hover:bg-zinc-50`, `hover:bg-zinc-100` |
| Selected row | `bg-zinc-100` |
| Brand red (user avatar) | `bg-red-600` text white |
| Online indicator | `bg-emerald-500` dot with `border-2 border-white` |
| Destructive | `text-red-600`, `text-red-700`, `bg-red-50` |
| Amber warnings | `bg-amber-50`, `text-amber-900`, `bg-amber-100` |
| Primary CTA (contacts add) | `bg-zinc-900 text-white hover:bg-zinc-800` |

### 2.4 Spacing & radii

| Pattern | Value |
|---------|--------|
| Workspace sidebar width (expanded) | `w-64` (256px) |
| Workspace sidebar (collapsed) | `w-[4.25rem]` (68px) |
| Thread list width (desktop expanded) | `md:w-72` (288px), min `220px` |
| Thread list collapsed (desktop) | `md:w-[4.25rem]` |
| Contact side panel | `w-[min(100%,24rem)]` (384px max) |
| Message max bubble width | `max-w-[min(92%,26rem)]` (~416px) |
| Standard padding (page content) | `px-4 py-6 md:px-8` |
| Card padding | `p-5` or `p-6` |
| Composer outer padding | `p-3` |
| Bubble padding | `px-4 py-2.5` |
| Bubble corner radii | Large: `1.25rem` on three corners; small corner `rounded-md` or `rounded-br-md` on tail side |
| Composer pill | `rounded-[1.375rem]` (~22px) |
| Buttons (icon) | `h-10 w-10` in composer; `p-2` in headers |
| Touch minimum | Composer textarea `min-h-[44px]` |

### 2.5 Motion

| Class | Effect |
|-------|--------|
| `animate-message-in` | New message: fade + 8px translate up, 0.2s |
| `animate-fade-in` | Thread rows appear with staggered delay (22ms × index, max 12) |
| `animate-pane-swish` | Conversation pane slides in from right 10px, 0.38s |
| `animate-pane-swish-left` | From left |
| `animate-scale-in` | Dropdowns/modals scale from 0.95 |
| `animate-search-highlight` | Search jump-to-message: blue ring flash 2s |
| Mobile panel slide | `translate-x-full` / `translate-x-0`, 300ms, cubic-bezier(0.25, 0.82, 0.25, 1) |
| Button press | `scale(0.985)` active state globally |
| `prefers-reduced-motion` | Pane swish animations disabled |

### 2.6 Icons

Library: **lucide-react**. Common mappings:

| Feature | Icon |
|---------|------|
| Messages / inbox | `MessageSquare` |
| Team chat | `MessagesSquare` |
| Search | `Search` |
| Profile | `User` |
| Contacts | `BookUser` |
| Settings | `Settings` |
| Help | `HelpCircle` |
| Calls | `Phone` |
| Dev dashboard | `LayoutDashboard` |
| Bug report | `Bug` |
| New conversation | `Plus` |
| Group thread | `Users` |
| Attach | `Paperclip` |
| Send | `Send` |
| Snippets | `Tag` |
| Archive / done | `Archive`, `ArchiveRestore` |
| Read/unread thread | `MailOpen`, `Mail` |
| Back (mobile) | `ArrowLeft` |
| More actions | `MoreVertical` |

---

## 3. Global app shell

Every authenticated workspace route (`/inbox`, `/chat`, `/calls`, `/contacts`, `/profile`, `/settings`, `/help`, `/team/[id]`) renders inside **WorkspaceShell**.

### 3.1 Root layout

- `<body>`: `bg-zinc-50 text-zinc-900`, full viewport height
- Toast host: **Sonner**, `position="top-center"`, `richColors`
- Favicon: `/TAV-LOGO-1.svg`

### 3.2 Shell structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Desktop only: InboxSidebar 256px or 68px collapsed]        │
├─────────────────────────────────────────────────────────────┤
│ [Mobile header — hidden on /inbox]  Menu | Title | (none)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Route children (main content)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Background rule:**

- Route `/inbox`: shell + main = **`bg-white`**
- All other routes: shell outer = **`bg-zinc-100`**, scrollable content area typically **`bg-zinc-50`**

**Height:** `h-[100dvh] overflow-hidden` on shell flex container.

### 3.3 Desktop left sidebar (`InboxSidebar`)

**Visibility:** `hidden md:flex` — only from `md` breakpoint (768px) up.

**Width:** Animated transition 300ms:

- Expanded: `md:w-64`
- Collapsed: `md:w-[4.25rem]`
- State persisted in `localStorage` key `tav-inbox-sidebar-collapsed`

**Structure (expanded):**

1. **Header row** — border-bottom `border-zinc-200`, padding `px-2 py-2`
   - Link to `/profile`: red circle avatar `h-9 w-9 bg-red-600`, user name `text-sm font-semibold`, email `text-[11px] text-zinc-500`
   - Green online dot on avatar (bottom-right)
   - Collapse button: `ChevronLeft`, `p-1.5 text-zinc-500`

2. **Section "Main"** — nav links, each:
   - `flex gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100`
   - Active: `bg-zinc-100 font-medium text-zinc-900`, icon `text-zinc-900`
   - Inactive icon: `text-zinc-500`
   - Items: Search (button), Messages, Profile, Contacts, Settings, Help, Dev dashboard (operators only), Calls, Chat

3. **Section "Inboxes"** — header row with "Customize" link to `/settings#inbox-sidebar`
   - Inbox list: bordered card `rounded-lg border border-zinc-100 divide-y divide-zinc-100`
   - Each inbox row:
     - Selected: `bg-zinc-100`, left accent `border-l-2 border-l-zinc-900`
     - Unread (not selected): blue ring on icon `ring-2 ring-[var(--tav-messaging-link)]`, unread pill `bg-[var(--tav-messaging-link)] text-white text-[10px]`
     - Thread count pill (no unread): `bg-zinc-200 text-zinc-600 text-[10px]`
     - Phone subline: `text-[10px] text-zinc-500` formatted number
     - No number badge: `bg-amber-100 text-amber-800 text-[9px]` "No number"
     - Settings gear button on right strip: `SlidersHorizontal h-3.5`

4. **Section "Your team"** — avatar links to `/team/[userId]`, `ContactAvatar` size sm, current user gets green dot

**Collapsed sidebar:** Icon-only column centered; inbox icons as colored tiles (see §4 Inbox visual identity); team avatars stacked.

**Badge colors in nav:**

| Badge type | Style |
|------------|--------|
| Chat unread | `bg-[var(--tav-bubble-out)] text-white` pill |
| Missed calls / dev pending | `bg-amber-100 text-amber-900` pill (expanded) or `bg-amber-500` dot on icon (collapsed) |

### 3.4 Mobile navigation

**On `/inbox`:** No top header in shell — inbox has its own header.

**On other routes:** Top bar `md:hidden`:

- `border-b border-zinc-200 bg-white px-3 py-2`
- Hamburger `Menu` → opens slide-over drawer from left
- Title: route name (`Contacts`, `Calls`, `Chat`, etc.) — `text-sm font-semibold truncate`

**Mobile drawer** (`fixed inset-0 z-50`):

- Scrim: `bg-black/40`
- Panel: `w-[min(100%,18rem)] bg-white shadow-xl border-r`
- Header "Menu" + close `ChevronLeft`
- Same nav links as sidebar + inbox list at bottom with unread pills

### 3.5 User menu (inbox header only)

Trigger: red avatar `h-8 w-8` + `ChevronDown`, `rounded-full hover:bg-zinc-100`.

Dropdown: `w-56`, `rounded-lg border shadow-lg animate-scale-in`, right-aligned.

Sections: user name/email header → links (Profile, Contacts, Settings, Help, Bug report, Dev dashboard, Calls) → sign out in red.

---

## 4. Inbox visual identity (per phone line)

Each inbox gets a **stable visual pair** from its UUID hash:

**Pastel tile (background + icon color)** — 8 swatches cycling:

| Index | Background | Icon text |
|-------|------------|-----------|
| 0 | `bg-blue-100` | `text-blue-700` |
| 1 | `bg-emerald-100` | `text-emerald-700` |
| 2 | `bg-violet-100` | `text-violet-700` |
| 3 | `bg-amber-100` | `text-amber-800` |
| 4 | `bg-rose-100` | `text-rose-700` |
| 5 | `bg-cyan-100` | `text-cyan-800` |
| 6 | `bg-indigo-100` | `text-indigo-700` |
| 7 | `bg-teal-100` | `text-teal-800` |

**Glyph icon** (same index): one of `Inbox`, `Mail`, `MessageSquare`, `MessagesSquare`, `Phone`, `Smartphone`, `Building2`, `Briefcase`.

**Selected inbox (collapsed rail):** `ring-2 ring-zinc-900 ring-offset-2 ring-offset-white`

**Unread inbox:** `ring-2 ring-[var(--tav-messaging-link)]` on icon tile

---

## 5. Avatar system

### 5.1 Contact avatar (single person)

Circle, **solid saturated color** from phone hash, **white initials**:

- Sizes: sm `h-8 w-8 text-xs`, md `h-10 w-10 text-sm`, lg `h-12 w-12 text-base`
- Initials: first+last name letters, else last 2 digits of phone, else `??`
- 12 colors: blue, emerald, purple, orange, pink, teal, indigo, rose, cyan, amber, violet, fuchsia (500-level Tailwind)

### 5.2 Group contact avatar

Google-style **composite circle** — up to 4 quadrants, each with member color + one letter.

- Same size map as contact avatar (32/40/48px)
- 1 member: full circle single color
- 2 members: 2-column grid
- 3–4: 2×2 grid; 3-person layout uses first cell spanning 2 columns

### 5.3 Sender initials avatar (outbound SMS tail)

Small circle beside outbound bubble on last message in a group:

- xs: `h-7 w-7 text-[10px]`, sm: `h-8 w-8 text-xs`
- Same color hashing as contact avatar but keyed on `userId`

### 5.4 Workspace user avatar (nav)

Always **`bg-red-600`** with white initials — distinct from contact colors.

---

## 6. Messages / Inbox (`/inbox`) — main screen

This is the primary worker surface. Full viewport height, white background.

### 6.1 Top header

`border-b border-zinc-200 bg-white px-3 py-3 md:px-4`, `z-30`

**Mobile (md:hidden):**

- Inbox selector button: inbox name `font-semibold`, unread pill if any, `ChevronDown`
- Opens bottom sheet (see §6.8)

**Desktop (hidden md:flex):**

- TAV logo (~32×22px, `opacity-90`) + "Messages" `text-lg font-semibold`

**Right side (both):**

- Search icon button: `rounded-full p-2 hover:bg-zinc-100`, icon `h-5 w-5 text-zinc-600`
- User menu

**Error banner (if load fails):** `bg-amber-50 text-sm text-amber-900 px-3 py-2`

### 6.2 Three-column layout (desktop)

```
┌──────────┬────────────────────────────┬─────────────┐
│ Thread   │   Conversation + composer  │  Contact    │
│ list     │                            │  side panel │
│ #f8f8f8  │   white                    │  white      │
│ 288px    │   flex-1 min 280px         │  384px max  │
└──────────┴────────────────────────────┴─────────────┘
```

Thread list and side panel can **collapse to icon-only** (`4.25rem`) on desktop independently.

### 6.3 Mobile layout (inbox)

Two full-screen layers that slide horizontally:

1. **Thread list** — visible when no thread selected (`selectedThreadId === null`)
2. **Conversation** — slides in when thread selected; thread list translates `-100%` off-screen

Transition: 300ms ease, same cubic-bezier as above.

### 6.4 Thread list column

**Background:** `#f8f8f8`

**Top action bar** (`border-b border-zinc-200/80`):

- "New conversation" — `Plus` icon + label, highlights when `selectedThreadId === "new"`
- "Group" — `Users` icon, separated by `border-l border-zinc-100`
- Desktop collapse toggle — `ChevronLeft`/`ChevronRight`, hidden on mobile

**Filter tabs** (segmented control style):

- Container: `gap-1 px-2 py-1.5 border-b border-zinc-200/80`
- Three tabs: **Active**, **Unread** (count in parentheses), **Done Deals** (archived count)
- Active tab: `bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 rounded-md`
- Inactive: `text-zinc-600 hover:bg-zinc-100`

**Thread row** (`border-b border-zinc-50`):

| State | Visual |
|-------|--------|
| Default | white/transparent, `hover:bg-zinc-50` |
| Selected | `bg-zinc-100` |
| Unread | `border-l-[3px] border-l-[var(--tav-bubble-out)]`, `bg-zinc-100/50`, bold title, blue dot on avatar |
| Hover actions | Mark read/unread, archive — `border-l border-zinc-100/80`, icons `text-zinc-400`; desktop hidden until `group-hover` |

**Row content:**

- Avatar: `ContactAvatar` md or `GroupContactAvatar`
- Title line: name + relative time `text-xs text-zinc-500` (right)
- Preview line: `text-sm text-zinc-600`; unread uses `font-medium text-zinc-800`
- Outbound preview prefix: **"You: "** in normal weight
- Draft preview: **"Draft:"** in `font-semibold text-[var(--tav-messaging-link)]`

**Swipe actions:** Not implemented — action buttons on row edge instead.

### 6.5 Conversation header

`border-b border-zinc-200 bg-white px-4 py-3`

- Optional shadow when scrolled: `shadow-[0_6px_12px_-4px_rgba(15,23,42,0.12)]`
- Mobile back button: `ArrowLeft` + "Back" `text-sm font-medium text-zinc-700`
- Avatar lg + name (`font-semibold text-zinc-900`) + subtitle phone/group info `text-xs text-zinc-500`
- Group type hints: `text-[11px] text-zinc-500` explanatory copy
- Actions: voice call button, archive, more menu (`MoreVertical`), mobile "Contact" button for side panel sheet
- Empty state (no thread): centered inbox icon in `bg-zinc-100` circle + "Select a conversation"

**Editable contact name:** Click name → inline input `border border-zinc-400 ring-2 ring-zinc-200`; pencil icon fades in on hover

### 6.6 Message thread area

**Scroll container:** `bg-white px-5 py-4 md:px-6`, absolute fill

**Date dividers** (sticky top):

- Pill: `rounded-full bg-black/[0.06] px-3 py-0.5 text-[11px] font-medium text-zinc-600`
- Labels: "Today", "Yesterday", or weekday + month + day

**Message bubbles — outbound (right-aligned):**

```
Layout: ml-auto, flex row-reverse, gap-2, max-w-[min(92%,26rem)]
Bubble:
  - Gradient background (see §2.1)
  - White text
  - Corners: rounded-tl/tr/bl 1.25rem, rounded-br-md (small corner for tail)
  - Tail pseudo-element bottom-right (#107eef)
  - Inset highlight shadow on gradient
  - Padding px-4 py-2.5, text-base leading-relaxed
Footer inside bubble: status icon + time text-[10px] text-[var(--tav-bubble-out-dim)]
Sender avatar: optional h-7 w-7 at bottom-right of row (last in group)
Failed: border-2 border-red-500; Retry button white pill with blue text
```

**Message bubbles — inbound (left-aligned):**

```
Bubble:
  - bg var(--tav-bubble-in), text black
  - ring-1 ring-zinc-900/[0.07], shadow sm
  - Tail pseudo bottom-left
  - Corners: rounded-tl/tr/br 1.25rem, rounded-bl-md
Group sender name above bubble (non-grouped): text-[11px] font-medium text-zinc-500
Timestamp below bubble (outside): text-[10px] text-zinc-400 pl-1
```

**Grouping:** Consecutive same-direction messages reduce vertical gap (`mt-0` vs `mt-2`); date change adds `mt-3`.

**Media attachments:**

- Images: `max-h-52 rounded-lg object-contain`, ring white/30 outbound, zinc-200 inbound
- Non-image files: pill button with underline, white/20 outbound or zinc-200 inbound

**Drop overlay (drag files):**

- Dashed border `border-[var(--tav-messaging-link)]/75`, tinted blue background, centered "Drop to send" `text-xl font-semibold text-[var(--tav-messaging-link)]`

**Jump to latest FAB** (when scrolled up):

- `rounded-full border bg-white shadow-md bottom-4 center`, "New message" + `ArrowDown`

### 6.7 Composer (SMS)

**Container:** `border-t border-zinc-200/80 bg-[var(--tav-composer-slab)] p-3`

**Disabled state (no Twilio number on inbox):** centered `text-sm text-zinc-500`

**Attachment preview list:** `rounded-lg border bg-zinc-50`, file name + size, remove X

**Input pill:**

- Outer: `rounded-[1.375rem] border border-zinc-200/90 bg-white px-1 py-1 shadow-sm`
- Focus: `border-zinc-300 shadow-md ring-1 ring-zinc-200/60`
- Left buttons: Paperclip (attach), Tag (snippets) — `h-10 w-10 rounded-xl text-zinc-600 hover:bg-zinc-200/80`
- Textarea: transparent, `min-h-[44px]`, `text-sm`, placeholder zinc-400
- Send: `h-10 w-10 rounded-full bg-[var(--tav-bubble-out)] text-white`, disabled `bg-zinc-300`, spinner when sending

**Placeholder variants:**

- Default: "Type a message…"
- With attachments: "Caption (optional)…"
- New convo no recipient: "Choose a recipient above first…"

**Hint line below:** `text-xs text-zinc-400` — "Shift+Enter to send · Enter for new line · Snippet icon or / for commands · …"

**Character counter:** `text-xs`, turns `text-red-600` over SMS limit (1600)

### 6.8 Inbox selector sheet (mobile)

Bottom sheet: `rounded-t-2xl bg-white shadow-2xl max-h-[80vh]`

- Scrim `bg-black/50`
- Title "Select Inbox" `text-lg font-semibold`
- Rows: large icon tile + name + phone + unread badge + checkmark for selected
- Unread row: `border-l-4 border-l-[var(--tav-bubble-out)]`

### 6.9 New conversation flow

When `selectedThreadId === "new"`:

- Header shows "New conversation" + recipient hint
- Center panel: card `rounded-2xl border bg-zinc-50/90 p-4 shadow-sm`
- Title "Who are you messaging?"
- Contact picker embedded (`OutboundContactRecipientPicker`)
- Link "Open directory" in accent blue
- Composer enabled once valid E.164 set

### 6.10 Contact side panel (desktop)

Right column, hidden on mobile (`hidden md:flex`), width max 24rem.

Sections include: contact name edit, phone, inbox name, thread notes textarea, directory notes, custom properties key/value rows, links to full contact record.

Mobile equivalent: full-screen sheet via "Contact" button in conversation header.

### 6.11 Voice call controls (in thread header)

**Idle:** Square button `border border-zinc-200 p-2`, Phone icon `text-zinc-600`, hover green tint

**In call:** Pill `border-emerald-200 bg-emerald-50` with timer, mute toggle, red hang-up `bg-red-600 text-white`

**Incoming call modal** (global overlay `z-[100]`):

- Scrim `bg-black/40`
- Card `rounded-2xl border bg-white p-5 shadow-xl max-w-sm`
- Green pulsing phone icon in `bg-emerald-100`
- Decline (outline) + Accept (green `bg-emerald-600`) buttons `rounded-xl`

### 6.12 Search modal

Full-screen overlay: `bg-black/60 backdrop-blur-sm z-[100]`

Dialog: `max-w-xl rounded-2xl border bg-white shadow-2xl`

- Search input row on `bg-zinc-50/90` with Search icon
- Results: avatar + title + inbox badge (`bg-zinc-100 uppercase text-[10px]`) + preview
- Compose hits: blue "New message — matches Contacts (no thread yet)"
- Min query length 3 characters; 450ms debounce
- Keyboard: Escape closes; Ctrl/Cmd+K toggles from inbox

---

## 7. Empty states

Shared component with variants — centered column, icon in colored circle:

| Variant | Icon circle | Title | Tone |
|---------|-------------|-------|------|
| `no-threads` | zinc-200, MessageSquare | "No conversations yet" | Neutral |
| `no-threads-history` | amber-100, Archive | "No phone number" | Warning |
| `no-archived-threads` | zinc-200, Archive | "No done deals yet" | Neutral |
| `no-unread-threads` | zinc-200, MessageSquare | "All caught up" | Positive |
| `no-messages` | emerald-100, Send | "Start the conversation" | Encouraging |
| `select-thread` | zinc-100, Inbox | "Select a conversation" | Neutral |
| `no-inboxes-assigned` | amber-100, Inbox | "No inboxes assigned yet" | Warning |

Typography: title `text-lg font-semibold text-zinc-900`, body `text-sm text-zinc-600`

---

## 8. Team chat (`/chat`)

Separate from SMS — internal staff messaging. Layout mirrors inbox at high level.

### 8.1 Page structure

`flex h-full flex-col md:flex-row`

**Left list** (`md:w-80`, white, border-right):

- Header: "Chat" `text-lg font-semibold` + subtitle `text-xs text-zinc-500` ("Developers only" in code — treat as internal team chat in product)
- "New" button: `rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white` + Plus icon
- Conversation rows: same pattern as SMS thread list — avatar, title, preview, time, unread dot `bg-[var(--tav-bubble-out)]`

**Right pane** (flex-1, white):

- Header: back on mobile, title, info button for groups
- Messages: `px-3 py-4 md:px-6`, max bubble width same as SMS
- Bubbles use same colors; chat outbound uses gradient without SMS tail pseudo in all cases
- Group messages show sender name `text-[11px] text-zinc-500`
- Reply quote block: left border, muted background, truncated original
- Reactions row below bubble (see §8.2)
- Composer at bottom (see §8.3)

**Mobile:** list OR thread via `mobileShowThread` — same slide pattern as inbox.

### 8.2 Chat reactions

Pills: `rounded-full px-2 py-0.5 text-xs ring-1`

- Mine: `bg-[var(--tav-bubble-out)]/15 text-[var(--tav-bubble-out)] ring-[var(--tav-bubble-out)]/30`
- Others: `bg-white text-zinc-700 ring-zinc-200`

Add button: circle `h-7 w-7` with SmilePlus; picker popup white shadow grid of emoji

### 8.3 Chat composer

`border-t border-zinc-200 bg-white p-3 md:p-4`

- Max width inner `max-w-2xl mx-auto`
- Reply banner: `rounded-xl bg-zinc-100 text-xs`
- Voice recording bar: `bg-red-50 text-red-700 ring-1 ring-red-200`, pulsing dot
- Pending files: thumbnail chips in `bg-zinc-100 rounded-xl`
- Row: Paperclip + Mic (circle buttons h-10) + textarea `rounded-2xl border focus:ring-2 ring-[var(--tav-messaging-link)]` + Send circle (same blue as SMS)
- Enter sends, Shift+Enter newline

---

## 9. Calls (`/calls`)

Standard content page on `bg-zinc-50`:

- Title `text-2xl font-semibold` + subtitle `text-sm text-zinc-600`
- Max width `max-w-5xl` centered

**Table card:** `rounded-xl border border-zinc-200 bg-white shadow-sm`

- Info header strip `bg-zinc-50 border-b text-xs text-zinc-600`
- Missed count highlight `text-amber-800`
- Table: uppercase column headers `text-xs text-zinc-500`
- Missed inbound rows: `bg-amber-50/70`
- Status pills:
  - completed → green-100/800
  - missed/no-answer/busy → amber
  - failed → red
  - in-progress/ringing → blue
- Thread link: `text-blue-600 hover:text-blue-800`

---

## 10. Contacts (`/contacts`)

Page shell same as Calls/Profile (`bg-zinc-50`, `max-w-3xl`).

**Tab switcher:** `rounded-lg border bg-white p-1 shadow-sm` — three tabs:

- External contacts (BookUser icon)
- Team (Users)
- Saved groups (Layers)

Active tab: `bg-zinc-100 text-zinc-900`; inactive hover zinc-50

**Primary actions:** "Add contact" / "Add group" — `rounded-lg bg-zinc-900 text-white`

**Filter card:** white bordered shadow, sort dropdown + tag filter inputs, standard input styling:

`rounded-lg border border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`

**Search field:** full width with optional loading spinner (Loader2)

**Contact list rows:** white card list, divided rows

- Name `font-medium text-zinc-900`, phone `text-sm text-zinc-500`, notes clamped, tag chips `rounded-full bg-zinc-100 text-[11px]`
- Actions: Message (blue-50 border), Edit (zinc border), Delete (red border)

---

## 11. Profile & Settings

### 11.1 Profile (`/profile`)

Page title + `ProfileForm` in stacked cards:

- Each field group: `rounded-xl border border-zinc-200 bg-white p-5 shadow-sm`
- Labels `text-sm font-medium text-zinc-800`, hints `text-xs text-zinc-500`
- Inputs: full width `rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200`
- Email read-only block with uppercase label `text-xs tracking-wide text-zinc-500`
- Save button: primary dark or blue (match form submit in file)

### 11.2 Settings (`/settings`)

Sections in `space-y-8`:

1. **Inbox sidebar preferences** — reorder/show/hide inboxes (customize panel component)
2. **Account** card — link to profile in blue
3. **Preferences** card — iOS-style toggle switches:
   - Track: `h-7 w-12 rounded-full`, on `bg-blue-600`, off `bg-zinc-300`
   - Knob: white circle translates x-5 when on
   - Desktop notifications + notification sounds

---

## 12. Help (`/help`)

Same page shell as Settings. Content = stacked white cards with keyboard shortcut docs:

- `<kbd>` chips: `rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs`
- Footer links in `text-red-600` (brand accent for links on help page)

---

## 13. Teammate view (`/team/[userId]`)

Centered card `max-w-lg rounded-xl border bg-white p-6 shadow-sm`:

- Large avatar + name center/stacked
- Definition list for mobile phone
- Action buttons: "Message in app" (border zinc), SMS compose (if phone), outline style `rounded-lg border px-4 py-2 text-sm font-medium`

---

## 14. Login & unauthenticated screens

### 14.1 Login (`/login`)

**Dark hero layout** — distinct from workspace:

- Background `bg-zinc-950` with red radial gradients (brand atmosphere)
- Header: TAV brand link + "Home" muted link
- Logo in frosted card `bg-white/[0.06] ring-1 ring-white/10 backdrop-blur`
- Headline white `text-3xl sm:text-4xl font-bold`
- Body `text-zinc-400`
- Sign-in card: `rounded-2xl border border-red-500/25 bg-zinc-900/70 shadow-2xl ring-1 ring-red-500/10`
- Google button: white `h-12 rounded-xl border border-zinc-600/80`, Google 4-color mark SVG
- Error alerts: red or amber bordered boxes inside card

### 14.2 Pending approval

Light layout `bg-zinc-50`, white header, centered card `rounded-2xl border p-8 shadow-sm`, sign out at bottom.

---

## 15. Message delivery status icons

Inside outbound bubbles (white icons) or inbound (colored):

| Status | Icon | Inbound color |
|--------|------|---------------|
| delivered | CheckCheck | green-500 |
| sent | Check | green-500 |
| queued/sending | Clock | amber-500 |
| failed/undelivered | X | red-500 |
| unknown | AlertCircle | zinc-400 |

Size: `h-3.5 w-3.5`

---

## 16. Loading & skeleton states

| Surface | Pattern |
|---------|---------|
| Thread list | `ThreadListSkeleton` — pulsing rows |
| Message list | `MessageListSkeleton` — bubble placeholders |
| Workspace route change | Overlay skeleton via `WorkspaceRouteSkeletonOverlay` |
| Shell suspense | Centered "Loading…" `text-sm text-zinc-500` on zinc-100 |
| Chat page | "Loading chat…" centered |
| Search | 6-row avatar + text pulse skeleton |

---

## 17. Notifications & toasts

**Sonner toasts:** top-center, rich colors (success green, error red, etc.)

**Desktop notification ping** (optional): OS-level — design N/A in app chrome.

**In-app unread indicators:**

| Location | Style |
|----------|--------|
| Sidebar inbox | Blue pill or dot |
| Chat nav | Blue pill count |
| Calls nav | Amber missed count |
| Dev dashboard | Amber pending user count |
| Thread row | Blue left border + dot on avatar |

---

## 18. Responsive breakpoints

Tailwind defaults — critical behavior:

| Breakpoint | Behavior |
|------------|----------|
| `< md` (768px) | No persistent sidebar; hamburger menu; inbox thread list/conversation slide; inbox selector sheet; contact panel as sheet |
| `≥ md` | Sidebar visible; inbox 3-column; chat 2-column side-by-side; mobile headers hidden on inbox |

---

## 19. Brand assets

- **Logo:** `/TAV-LOGO-1.svg` — used in inbox header (desktop), login, brand links
- **App title:** "TAV Inbox" (metadata)
- **User-facing product name in UI:** "Messages" (inbox), "TAV Inbox" (mobile menu fallback title)

---

## 20. Screen inventory (worker-facing)

| Route | Layout summary |
|-------|----------------|
| `/login` | Dark full-page auth |
| `/inbox` | Full-height white messaging (thread list + conversation + optional side panel) |
| `/chat` | Internal team chat (list + thread) |
| `/calls` | Table history on zinc-50 |
| `/contacts` | Tabbed directory on zinc-50 |
| `/profile` | Form cards on zinc-50 |
| `/settings` | Preference cards on zinc-50 |
| `/help` | Doc cards on zinc-50 |
| `/team/[id]` | Profile card |
| `/pending-approval` | Status card |

Operator-only surfaces (dev dashboard embed in inbox via `?dev=1`) use admin tables — **out of scope** for worker mobile parity unless explicitly needed.

---

## 21. Implementation notes for mobile parity

When adapting to mobile-native layout, preserve these **identity anchors**:

1. **Outbound blue** `#0a84ff` gradient bubbles, **inbound gray** `#e5e5ea`
2. **Composer slab** `#f2f2f7` behind input area
3. **Red user avatar** in nav vs **hashed color contact avatars**
4. **Pastel inbox icon tiles** with matching Lucide-style glyphs
5. **Zinc chrome** — white cards, zinc-200 borders, zinc-500 secondary text
6. **Unread accent** — blue left border / blue dots / blue pills (not red)
7. **Thread list density** — avatar 40px, two-line preview, relative timestamps
8. **Rounded composer pill** with circular blue send button
9. **Empty states** — icon circle + title + short helper copy
10. **Segmented filters** — Active / Unread / Done Deals with white selected chip

Typography and exact pixel values can scale with platform conventions; colors, hierarchy, and component semantics above should stay consistent so workers recognize the app instantly.

---

*Document generated from TAV-Twilio web codebase. For behavior/API details see other docs in `docs/`.*
