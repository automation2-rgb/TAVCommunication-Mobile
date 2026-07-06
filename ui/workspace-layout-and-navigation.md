# Workspace layout, navigation, and design system

UI shell, navigation, and **visual design specifications** for TAV Communication on production `master`. Values below are taken from `web/app/globals.css`, `web/app/layout.tsx`, and component class names in the codebase.

---

## Design philosophy

The workspace follows a **light, neutral zinc palette** with **iOS-style messaging** in the inbox (blue outbound bubbles, gray inbound). **Login (`/login`)** alone uses a **dark zinc hero** (`zinc-950`). Onboarding and account-status pages use the **light account shell** like profile/settings.

Interaction defaults:

- **Press feedback:** buttons scale to `0.985` on `:active` (global base styles)
- **Tap targets:** most icon buttons are **40×40px** (`h-10 w-10`); send is **40×40px** circle
- **Corners:** `rounded-lg` (8px) for nav/items; `rounded-xl` / `rounded-2xl` for cards; **pill composer** `rounded-[1.375rem]`
- **Icons:** Lucide React, typically **16–20px** in nav (`h-4`–`h-5`), **18px** in collapsed sidebar

---

## Typography

| Token | Value |
|-------|--------|
| **Primary font** | Geist Sans (`--font-geist-sans`) via `next/font/google` |
| **Monospace** | Geist Mono (`--font-geist-mono`) — code snippets in warnings |
| **Body default** | `text-zinc-900` on `bg-zinc-50` (root layout) |
| **Inbox messenger** | Explicit stack: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |

### Type scale (common classes)

| Use | Classes |
|-----|---------|
| Page title (account pages) | `text-2xl font-semibold tracking-tight text-zinc-900` |
| Inbox header (desktop) | `text-lg font-semibold text-zinc-900` |
| Section labels (sidebar) | `text-[11px] font-semibold uppercase tracking-wide text-zinc-400` |
| Nav / list items | `text-sm` (14px) |
| Thread snippet | `text-sm`; unread uses `font-semibold text-zinc-900` |
| Message bubble body | `text-base leading-relaxed` (16px) |
| Composer textarea | `text-sm leading-relaxed` |
| Helper / meta text | `text-xs text-zinc-500` or `text-zinc-400` |
| Timestamps | `text-xs text-zinc-500` |

---

## Color palette

### CSS custom properties (`globals.css`)

| Token | Value | Usage |
|-------|--------|--------|
| `--primary` | `37 99 235` (blue-600) | Semantic primary (RGB triplet) |
| `--primary-foreground` | white | On primary |
| `--success` | `22 163 74` (green-600) | Success semantic |
| `--warning` | `245 158 11` (amber-500) | Warnings, missed calls |
| `--error` | `220 38 38` (red-600) | Errors, destructive |
| `--tav-chat-canvas` | `#ffffff` | Message pane background |
| `--tav-composer-slab` | `#f2f2f7` | Composer strip (iOS grouped bg) |
| `--tav-bubble-out` | `#0a84ff` | Outbound bubble base (iOS blue) |
| `--tav-bubble-out-hover` | `#0b76e8` | Outbound hover / send button hover |
| `--tav-bubble-in` | `#e5e5ea` | Inbound bubble fill |
| `--tav-bubble-in-text` | `#000000` | Inbound text |
| `--tav-bubble-out-dim` | `rgba(255,255,255,0.72)` | Muted text on outbound bubbles |
| `--tav-messaging-link` | `#0a84ff` | Links in messaging context |

**Outbound bubble gradient** (`.bg-tav-bubble-out-gradient`):

```css
linear-gradient(180deg, #3498ff 0%, #0a84ff 42%, #107eef 100%)
```

### Tailwind zinc scale (workspace chrome)

| Role | Typical class |
|------|----------------|
| App background | `bg-zinc-50` |
| Panel / card | `bg-white` |
| Thread list background | `bg-[#f8f8f8]` |
| Borders | `border-zinc-200`, subtle `border-zinc-200/80` |
| Primary text | `text-zinc-900` |
| Secondary text | `text-zinc-600`, `text-zinc-700` |
| Muted / placeholder | `text-zinc-400`, `text-zinc-500` |
| Hover surface | `hover:bg-zinc-50`, `hover:bg-zinc-100` |
| Selected nav / row | `bg-zinc-100` + `font-medium text-zinc-900` |

### Brand / accent colors

| Color | Hex / class | Usage |
|-------|-------------|--------|
| **TAV red** | `bg-red-600` | User avatar circle in sidebar (org initial) |
| **Online indicator** | `bg-emerald-500` | Green dot on avatar (2×2 with white ring) |
| **Messaging blue** | `#0a84ff` / `var(--tav-bubble-out)` | Send button, unread dots, chat badges, links |
| **Warning amber** | `amber-50` bg, `amber-900` text | Banners; `amber-500` badge fill for missed calls / dev pending |
| **Destructive** | `red-600` / `red-700` | Primary destructive buttons; `red-50` hover on menu items |
| **Focus ring (forms)** | `focus:border-blue-500 focus:ring-2 focus:ring-blue-200` | Profile form inputs |

### Inbox icon swatches (pastel tiles)

Each inbox gets a stable pastel tile from `inbox-icon-swatch.ts`:

| Index | Background | Icon color |
|-------|------------|------------|
| 0 | `bg-blue-100` | `text-blue-700` |
| 1 | `bg-emerald-100` | `text-emerald-700` |
| 2 | `bg-violet-100` | `text-violet-700` |
| 3 | `bg-amber-100` | `text-amber-800` |
| 4 | `bg-rose-100` | `text-rose-700` |
| 5 | `bg-cyan-100` | `text-cyan-800` |
| 6 | `bg-indigo-100` | `text-indigo-700` |
| 7 | `bg-teal-100` | `text-teal-800` |

### Contact avatar colors (solid circles)

Hashed from phone — `bg-blue-500`, `emerald-500`, `purple-500`, `orange-500`, `pink-500`, `teal-500`, `indigo-500`, `rose-500`, `cyan-500`, `amber-500`, `violet-500`, `fuchsia-500` with **white** initials.

---

## Layout dimensions

### Viewport

| Element | Size |
|---------|------|
| Workspace height | `h-[100dvh]` with `overflow-hidden` |
| Account pages max width | `max-w-2xl` centered |

### Sidebar (`InboxSidebar`)

| State | Width |
|-------|--------|
| Expanded (desktop) | `md:w-64` (256px) |
| Collapsed (desktop) | `md:w-[4.25rem]` (68px) |
| Mobile drawer | `w-[min(100%,18rem)]` (288px max) |

### Inbox three-column (desktop)

| Column | Width |
|--------|--------|
| Thread list expanded | `md:w-72` (288px), `min-w-[220px]` |
| Thread list collapsed | `md:w-[4.25rem]` |
| Conversation | `flex-1`, `min-w-[280px]` |
| Side panel | `w-[min(100%,24rem)]` (384px max) — `hidden md:flex` |
| Side panel (mobile sheet) | `w-[min(100%,24rem)]` slide from right |

### Message bubbles

| Property | Value |
|----------|--------|
| Max width | `min(92%, 26rem)` (~416px) |
| Padding | `px-4 py-2.5` |
| Outbound radius | `rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-bl-[1.25rem] rounded-br-md` + tail pseudo |
| Inbound radius | mirrored with `rounded-bl-md` on left |
| Failed state | `border-2 border-red-500` |

---

## Buttons and controls

### Global interaction (all buttons)

From `globals.css` `@layer base`:

- `cursor: pointer` on buttons and `[role="button"]`
- `transition: transform 0.12s cubic-bezier(0.4, 0, 0.2, 1)`
- `:active` → `transform: scale(0.985)`
- `:disabled` → `cursor: not-allowed`

### Button variants

#### Primary — send (inbox composer)

```
h-10 w-10 rounded-full
bg-[var(--tav-bubble-out)] text-white
hover:bg-[var(--tav-bubble-out-hover)]
active:scale-90
disabled:bg-zinc-300 disabled:cursor-not-allowed
```

Icon: Lucide `Send` `h-5 w-5`; loading = white spinning ring `h-4 w-4 border-2 border-white border-t-transparent`.

#### Primary — save (profile form)

```
rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white
hover:bg-zinc-800
disabled:opacity-50
```

#### Primary — side panel add property

```
rounded-lg bg-tav-bubble-out px-3 py-2 text-sm font-medium text-white
hover:bg-tav-bubble-out-hover
disabled:bg-zinc-300
```

#### Secondary / ghost — nav item

```
rounded-lg px-2 py-1.5 text-sm text-zinc-700
hover:bg-zinc-100
Active: bg-zinc-100 font-medium text-zinc-900
```

#### Icon button — sidebar / header

```
h-10 w-10 rounded-lg text-zinc-600
hover:bg-zinc-100
Active nav: bg-zinc-100 text-zinc-900
```

#### Icon button — composer attach / snippets

```
h-10 w-10 rounded-xl text-zinc-600
hover:bg-zinc-200/80
Active snippets: bg-zinc-200/90 text-zinc-900
```

#### Destructive — thread menu

```
text-sm text-red-700 hover:bg-red-50 (dropdown row)
```

#### CTA — empty state / error

```
rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700
```

#### Google sign-in (login page)

```
h-12 w-full rounded-xl
border border-zinc-600/80 bg-white
px-4 text-sm font-medium text-zinc-800 shadow-sm
hover:bg-zinc-50
```

#### Jump to latest (floating)

```
rounded-full border border-zinc-200 bg-white
px-4 py-2 text-sm font-medium text-zinc-800 shadow-md
hover:bg-zinc-50
```

### Thread list filter tabs

```
rounded-md px-2 py-1.5 text-xs font-medium
Inactive: text-zinc-600 hover:bg-zinc-100
Active: bg-white text-zinc-900 shadow-sm (on #f8f8f8 bar)
```

### Selected thread row

```
border-l-[3px] border-l-[var(--tav-bubble-out)]
bg-zinc-100/50
Unread dot: h-2 w-2 rounded-full bg-[var(--tav-bubble-out)] ring-2 ring-white
```

---

## Form inputs

### Standard text input (profile)

```
w-full rounded-lg border border-zinc-300
px-3 py-2 text-sm text-zinc-900
focus:border-blue-500 focus:ring-2 focus:ring-blue-200
```

### Side panel / notes textarea

```
rounded-lg border border-zinc-200 bg-white (or bg-zinc-50)
px-3 py-2 text-sm
focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
placeholder:text-zinc-400
```

### Composer pill container

```
min-h-[48px] rounded-[1.375rem]
border border-zinc-200/90 bg-white px-1 py-1 shadow-sm
focus-within:border-zinc-300 focus-within:shadow-md focus-within:ring-1 focus-within:ring-zinc-200/60
```

Textarea inside: `min-h-[44px]`, no border, `text-sm`, `placeholder:text-zinc-400`.

---

## Badges and counts

| Badge type | Style |
|------------|--------|
| **Unread (sidebar collapsed)** | `h-4 min-w-4 rounded-full bg-[var(--tav-messaging-link)] text-[9px] font-bold text-white ring-2 ring-white` |
| **Unread (mobile drawer)** | `rounded-full bg-[var(--tav-bubble-out)] px-1.5 py-0.5 text-[10px] font-semibold text-white` |
| **Missed calls / dev pending (nav)** | `rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white` (collapsed) or `bg-amber-100 text-amber-900 text-[11px] px-2` (mobile drawer) |
| **Chat unread (mobile drawer)** | `bg-[var(--tav-bubble-out)] text-white text-[11px]` |
| **Inbox selected in header** | `bg-[var(--tav-messaging-link)] px-1.5 py-0.5 text-[10px] font-semibold text-white` — caps display `99+` |

---

## Avatars

| Type | Size | Style |
|------|------|--------|
| Contact `sm` | 32×32 | `rounded-full`, saturated hash color, white initials |
| Contact `md` | 40×40 | default in thread list |
| Contact `lg` | 48×48 | headers |
| User org avatar (sidebar) | 36×36 (`h-9 w-9`) | **`bg-red-600`** white initials |
| Sender tail (outbound) | small | `SenderInitialsAvatar` beside bubble |
| Team rail | 40×40 inbox buttons | Inbox glyph on pastel swatch |

---

## Message delivery icons

`MessageStatusIcon` — icons `h-3.5 w-3.5`:

| Status | Outbound color | Inbound color |
|--------|----------------|---------------|
| Delivered | white / dim | `text-green-500` |
| Sent | white 70% opacity | `text-green-500` |
| Sending | `text-white/65` | `text-amber-500` |
| Failed | `text-red-200` | `text-red-500` |

---

## Cards and panels

| Pattern | Classes |
|---------|---------|
| Profile / settings card | `rounded-xl border border-zinc-200 bg-white p-5 shadow-sm` |
| New conversation panel | `rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm` |
| Side panel definition list | `rounded-xl border border-zinc-100 bg-zinc-50/50` |
| Dropdown menu | `rounded-lg border border-zinc-200 bg-white py-1 shadow-lg` |
| Modal | `rounded-xl border border-zinc-200 bg-white shadow-xl max-w-md` |
| In-app toast (inbound) | `rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/5` |

---

## Login page (unsigned — dark theme)

Distinct from workspace:

| Element | Style |
|---------|--------|
| Page background | `bg-zinc-950` full viewport |
| Header | `border-white/5 bg-zinc-950/80 backdrop-blur-md` |
| Logo container | `rounded-2xl bg-white/[0.06] ring-1 ring-white/10` |
| Sign-in card | `rounded-2xl border border-red-500/25 bg-zinc-900/70 shadow-2xl ring-1 ring-red-500/10` |
| Error banner | `border-red-500/35 bg-red-950/50 text-red-100` |
| Warning banner | `border-amber-500/30 bg-amber-950/40 text-amber-100` |
| Body copy | `text-zinc-400` |

---

## Animations

| Class | Effect |
|-------|--------|
| `animate-message-in` | Fade + 8px translateY (200ms) — new messages |
| `animate-pane-swish` | Fade + 10px translateX — pane changes |
| `animate-drawer-swish` | Slide drawer from right |
| `animate-search-highlight` | Blue ring flash 2s on search result message |
| `animate-fade-in` / `animate-scale-in` | Modals, menus |

**Reduced motion:** pane/drawer swish animations disabled via `prefers-reduced-motion`.

---

## Toasts

Global: **Sonner** `<Toaster position="top-center" richColors />` in root layout.

---

## Overall structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│  WorkspaceShell (bg white / zinc-50, h-[100dvh])                           │
│  ┌─────────────┐  ┌────────────────────────────────────────────────────┐ │
│  │ InboxSidebar│  │ Main content                                       │ │
│  │ w-64 / 4.25rem│ │ InboxMessenger | Contacts | Chat | …              │ │
│  │ bg-white    │  │                                                    │ │
│  │ border-zinc-200│                                                    │ │
│  └─────────────┘  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key components:**

- `web/components/workspace-shell.tsx` — layout wrapper, mobile menu, nav badges
- `web/components/inbox-sidebar.tsx` — inbox rail + primary navigation
- `web/components/workspace-route-transition.tsx` — client navigation transitions, skeleton overlay

---

## Primary navigation items

| Label | Route | Icon | Badge source |
|-------|-------|------|--------------|
| Inbox | `/inbox` | MessageSquare | Per-inbox unread (sidebar rail) |
| Contacts | `/contacts` | BookUser | — |
| Calls | `/calls` | Phone | Missed calls (amber) |
| Chat | `/chat` | MessagesSquare | Unread (messaging blue) |
| Settings | `/settings` | Settings | — |
| Help | `/help` | HelpCircle | — |
| Developer dashboard | `/inbox?dev=1` | LayoutDashboard | Pending approvals (amber, operators) |

**User menu** (inbox header + expanded sidebar): Profile, Contacts, Settings, Help, Report a bug, Developer dashboard (operators), Calls (missed badge), Sign out. Dropdown `w-56` from avatar.

**Global actions:** Search (⌘/Ctrl+K on inbox), Bug report (`tav-open-bug-report`).

**Inbox mobile:** Workspace hamburger hidden on `/inbox` — inbox has own header with inbox picker, search, user menu.

**Sidebar collapse:** Persisted in `localStorage` key `tav-inbox-sidebar-collapsed`.

---

## Inbox rail (left column within sidebar)

Vertical list of inboxes the user can access.

| Behavior | Detail |
|----------|--------|
| Selection | Pastel swatch + glyph; active inbox highlighted |
| Unread badges | Blue pill on glyph; white-on-blue when inbox selected |
| Ordering | Settings → inbox rail preferences (localStorage) |
| URL sync | `/inbox?inbox=<uuid>` |

Each inbox button: **`h-10 w-10 rounded-lg`** with hover `bg-zinc-100`.

---

## Mobile vs desktop

| Breakpoint | Behavior |
|------------|----------|
| **Desktop (`md+`)** | Persistent sidebar; inbox three columns |
| **Mobile** | Hamburger → 18rem drawer; inbox single-pane with slide transitions; side panel = 24rem sheet |

Mobile header: `border-b border-zinc-200 bg-white px-3 py-2`, menu button `rounded-lg p-2`.

---

## Inbox page layout (`/inbox`)

```
┌────────────┬─────────────────────────┬─────────────────┐
│ Thread list│ Conversation            │ Side panel      │
│ #f8f8f8    │ bg-white                │ 24rem max       │
│ w-72       │ composer slab #f2f2f7   │ bg-white        │
└────────────┴─────────────────────────┴─────────────────┘
```

**Developer mode (`?dev=1`):** Thread list replaced by dev dashboard embed.

---

## URL conventions

| Route | Query params |
|-------|--------------|
| `/inbox` | `inbox`, `thread`, `compose=1`, `to=+1…`, `dev=1` |
| `/chat` | `user=<uuid>` |
| `/contacts` | `search`, `debug=contacts&find=<uuid>` |

---

## Attention / badge providers

| Provider | Updates |
|----------|---------|
| `DevConsoleAttentionProvider` | Dev nav + Calls badges |
| `ChatAttentionProvider` | Chat nav badge |
| `InboxRailSelectionProvider` | Sidebar unread sync |

---

## Loading states

- Skeleton overlays: zinc-100 pulsing blocks
- `thread-list-skeleton`, `message-list-skeleton`, `workspace-main-skeleton`

---

## Navigation edge cases

| Scenario | Behavior |
|----------|----------|
| Invalid `inbox` UUID | Falls back to first accessible inbox |
| Non-operator `?dev=1` | Redirect to `/inbox` |
| Thread reopens from Done | Auto-deselect on Done tab |

---

## Source files for design tokens

| File | Contents |
|------|----------|
| `web/app/globals.css` | CSS variables, bubbles, animations |
| `web/app/layout.tsx` | Geist fonts, body defaults, Sonner |
| `web/lib/messaging/inbox-icon-swatch.ts` | Inbox pastel colors |
| `web/components/contact-avatar.tsx` | Avatar sizes and hash colors |
| `web/app/inbox/inbox-messenger.tsx` | Composer, bubbles, thread list |
| `web/components/inbox-sidebar.tsx` | Nav chrome |
| `web/app/login/page.tsx` | Dark login theme |

---

## Related documents

- [02-inbox-and-direct-messaging.md](../flows/02-inbox-and-direct-messaging.md)
- [10-developer-admin-console.md](../flows/10-developer-admin-console.md)
- [modals-empty-states-and-overlays.md](./modals-empty-states-and-overlays.md)
