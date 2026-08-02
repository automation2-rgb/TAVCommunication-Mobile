# Mobile-first layout — design mapping

**Purpose:** Translate [`docs/web-design-flow.md`](./web-design-flow.md) (web visual spec) into a **native mobile-first** implementation plan for `mobile/`. This doc defines **layout structure**, **token mapping**, **screen → component wiring**, and **parity rules** when web CSS cannot be copied literally.

**Audience:** Anyone implementing UI in the Expo app. Behavior/API details stay in `flows/`, `reference/`, and `IMPLEMENTATION_PLAN.md`.

**Principle:** **Mobile-first structure, web-identical look.** Phone layout is primary. Colors, hierarchy, density, and component semantics match web so workers recognize the product instantly.

---

## Progress summary

**Last updated:** 2026-07-23 · **Current focus:** Compose screen restyle; supporting-screen polish; motion layer

| Area | Status |
|------|--------|
| §2 Native app shell | ✅ Done |
| §3 Inbox thread list + switcher + user menu | ✅ Done |
| §3 Conversation + bubbles + composer | 🟡 Mostly done — lg avatar, in-call header pill, failed retry pill pending |
| §3 Compose (`inbox/compose`) | ⬜ Not restyled |
| §6 Design tokens | ✅ Done (Geist font deferred) |
| §7 Avatars + inbox tiles | ✅ Done (group avatar deferred) |
| §8 Lucide icons | ✅ Done |
| §9 Supporting screens | 🟡 Functional — card/input/toggle polish pending |
| §10 Motion | 🟡 Press scale on key components only |
| §13 Identity anchors | 🟡 11/13 ✅ |

**Status legend:** ✅ Done · 🟡 Partial · ⬜ Not started · ⏸ Deferred

---

## 1. How this relates to the web doc

| Web doc section | Mobile-first use |
|-----------------|------------------|
| §1 Design philosophy | Keep — light mode, iOS messaging, zinc chrome |
| §2 Design tokens | Port hex values → `mobile/src/lib/theme.ts` |
| §3 Global shell (sidebar, desktop) | **Skip structure** — replace with §2 below |
| §3.4 Mobile navigation | **Primary reference** for nav pattern |
| §4 Inbox visual identity | ✅ Port hash → pastel tile + glyph |
| §5 Avatar system | ✅ `ContactAvatar` + `UserAvatar` (group avatar deferred) |
| §6 Inbox | **Highest priority** — thread list, conversation, composer |
| §7 Empty states | ✅ Map variants → `InboxEmptyState` |
| §8 Chat | Out of v1 scope — defer |
| §9–13 Supporting screens | Map to `(app)/*` routes |
| §14 Auth | Map to `(auth)/*` |
| §15–17 Status, loading, badges | ✅ Icons + colors ported; skeletons deferred |
| §18 Breakpoints | Native = always “`< md`” behavior |
| §21 Identity anchors | Acceptance checklist (§13) |

---

## 2. Native app shell (replaces web WorkspaceShell)

Web desktop uses a persistent sidebar + multi-column inbox. **Native v1 never shows a sidebar.** All routes use phone-first patterns.

### 2.1 Route map

| Web route | Expo route | Shell pattern | Status |
|-----------|------------|---------------|--------|
| `/login` | `(auth)/login` | Full-screen dark hero | ✅ |
| Onboarding | `(auth)/onboarding` | Light account card | ✅ |
| Pending / rejected | `(auth)/pending`, `(auth)/rejected` | Light account card | ✅ |
| `/inbox` | `(app)/inbox`, `(app)/inbox/[threadId]` | **Custom inbox shell** — no global back header | ✅ |
| New conversation | `(app)/inbox/compose` | Conversation-style header | 🟡 Functional; design pass pending |
| `/calls` | `(app)/calls` | `SupportScreenShell` | ✅ |
| `/contacts` | `(app)/contacts` | `SupportScreenShell` | ✅ |
| `/profile` | `(app)/profile` | `SupportScreenShell` | 🟡 |
| `/settings` | `(app)/settings` | `SupportScreenShell` | 🟡 |
| `/help` | `(app)/help` | `SupportScreenShell` | 🟡 |
| `/chat` | — | **v1 out of scope** | ⏸ |
| `/team/[id]` | — | **v1 out of scope** | ⏸ |
| Dev dashboard | — | **Out of scope** | ⏸ |

### 2.2 Navigation model

```
┌─────────────────────────────────────┐
│  INBOX (primary workspace)          │
│  ┌───────────────────────────────┐  │
│  │ InboxHeader (own header)      │  │
│  │  inbox name ▾  |  search user │  │
│  ├───────────────────────────────┤  │
│  │ Thread list OR Conversation   │  │
│  │ (Expo Router stack push)      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Supporting screens (Calls, Contacts, …):
┌─────────────────────────────────────┐
│ SupportScreenShell                  │
│  ← Inbox  |  Title                  │
├─────────────────────────────────────┤
│  bg-zinc-50 scroll content          │
└─────────────────────────────────────┘
```

**Inbox nav entry:** User menu sheet from inbox header (web §3.5) — not hamburger on inbox. ✅

**Supporting screen nav entry:** User menu → `router.push('/(app)/calls')` etc. Back returns to inbox. ✅

**No hamburger drawer on v1 mobile** unless we later unify with web §3.4; user menu + inbox switcher sheet cover v1 needs.

### 2.3 Background rules (mobile)

| Surface | Web token / class | Native | Status |
|---------|-------------------|--------|--------|
| Inbox thread list | `#f8f8f8` | `tavColors.threadListBg` | ✅ |
| Inbox conversation + header | `#ffffff` | `tavColors.canvas` / `white` | ✅ |
| Composer strip | `#f2f2f7` | `tavColors.composerSlab` | ✅ |
| Supporting pages | `bg-zinc-50` | `tavColors.zinc50` | ✅ |
| Cards on supporting pages | `bg-white` + border | `white` + `zinc200` border | 🟡 |

### 2.4 Safe areas

- Inbox header: `paddingTop: insets.top + 8` — ✅ in `InboxHeader`
- Composer: `paddingBottom: max(insets.bottom, 12)` — ✅ in `Composer`
- Modals/sheets: respect bottom inset — ✅ in switcher, attach menu, user menu

---

## 3. Inbox flow (mobile-first)

Web §6.3: two full-screen layers with horizontal slide. **Native equivalent:** Expo Router stack — thread list at `inbox/index`, conversation at `inbox/[threadId]`. Platform **push** transition (iOS slide from right); optional Reanimated polish later.

### 3.1 Thread list (`inbox/index`)

| Web element | Mobile component | Status | Notes |
|-------------|------------------|--------|-------|
| Header inbox selector | `InboxHeader` → `InboxSwitcherSheet` | ✅ | Unread pill, ChevronDown, red `UserAvatar` |
| Search (disabled v1) | Header icon button | ✅ | Lucide `Search`, disabled |
| User menu | `UserMenuSheet` | ✅ | Amber missed-calls badge on Calls row |
| New conversation | Header `Plus` | ✅ | Routes to `inbox/compose` |
| Filter tabs | `ThreadTabs` | ✅ | White selected chip + ring |
| Thread row | `ThreadRow` | ✅ | 40px avatar, blue left border unread, `You:` prefix, `#f8f8f8` bg |
| Row actions | Long-press `Alert` | ✅ | Native substitute for web hover buttons |
| Empty states | `InboxEmptyState` | ✅ | All §7 variants |
| Zero inboxes | `RequestInboxAccessPanel` | ✅ | Amber warning tone |

### 3.2 Conversation (`inbox/[threadId]`)

| Web element | Mobile component | Status | Notes |
|-------------|------------------|--------|-------|
| Back | `ConversationHeader` | ✅ | `ArrowLeft` + "Back" |
| Avatar + title + phone | `ConversationHeader` | 🟡 | Uses **md (40px)** avatar; web spec is **lg (48px)** |
| Call button | `ThreadVoiceCallControls` | 🟡 | Bordered square idle ✅; in-call uses `InCallOverlay` modal, not header emerald pill |
| Mark done / overflow | Header actions | ✅ | Lucide `Archive`, `MoreVertical` |
| Message list | `MessageList` + `MessageBubble` | ✅ | See §4 |
| Date dividers | `MessageList` | ✅ | Today / Yesterday / weekday pills |
| Jump to latest FAB | — | ⬜ | Optional v1.1 |
| Composer | `Composer` | ✅ | See §5 |
| Contact side panel | — | ⏸ | v1 skip |

### 3.3 Inbox switcher sheet

| Web §6.8 | Mobile `InboxSwitcherSheet` | Status |
|----------|----------------------------|--------|
| Bottom sheet, `rounded-t-2xl`, scrim 50% | Match radii + scrim | ✅ |
| Large pastel inbox tile + glyph | `InboxIconTile` + hash | ✅ |
| Unread: `border-l-4` blue | Row left border | ✅ |
| Checkmark on selected | Lucide `Check` | ✅ |

### 3.4 New conversation (`inbox/compose`)

| Web §6.9 | Mobile | Status |
|----------|--------|--------|
| Card "Who are you messaging?" | Recipient picker card on `zinc-50` | ⬜ |
| "Open directory" link | Link to contacts with return compose | ⬜ |
| Composer gated on E.164 | Behavioral gate works | ✅ |
| Shared `Composer` component | Plain form + text attach buttons | ⬜ Restyle to match thread composer |

---

## 4. Message bubbles (parity detail)

Web uses CSS gradient + pseudo-element tails. React Native has no pseudo-elements.

### 4.1 Target spec

| Property | Web | Native implementation | Status |
|----------|-----|------------------------|--------|
| Outbound fill | Gradient `#3498ff → #0a84ff → #107eef` | `LinearGradient` in `message-bubble.tsx` | ✅ |
| Inbound fill | `#e5e5ea` | `tavColors.bubbleIn` | ✅ |
| Outbound text | White | `#ffffff` | ✅ |
| Inbound text | Black | `#000000` | ✅ |
| Max width | `min(92%, 26rem)` | `maxWidth: '92%'` | ✅ |
| Padding | `16px × 10px` | `paddingHorizontal: 16, paddingVertical: 10` | ✅ |
| Large corners | `1.25rem` (20px) | `outboundBubbleRadii()` / `inboundBubbleRadii()` | ✅ |
| Tail corner | ~6px on one bottom corner | `tavLayout.bubbleRadiusTail: 6` | ✅ |
| Inbound ring | `ring-zinc-900/7%` | `borderWidth: 1, borderColor: rgba(0,0,0,0.07)` + shadow | ✅ |
| Outbound tail notch | CSS pseudo | Skipped — gradient + asymmetric radius sufficient | ⏸ |
| Status + time | Inside outbound footer | `MessageStatusIcon` + dim white time | ✅ |
| Inbound timestamp | Outside below bubble | `text-[10px] zinc-400` | ✅ |
| Failed state | Red border + retry pill | Red border ✅; retry pill | ⬜ |
| Media | `max-h-52 rounded-lg` | `AttachmentThumbnail` | ✅ |
| Grouping gap | `mt-0` vs `mt-2` | `compactTop` in `MessageList` | ✅ |

### 4.2 Remaining gaps (`message-bubble.tsx`)

- [x] Outbound gradient (`LinearGradient`)
- [x] Asymmetric corner radii (20px + 6px tail)
- [x] Inbound subtle ring/shadow
- [x] Inbound timestamp outside bubble
- [x] Message grouping spacing
- [ ] Failed message **retry pill** inside bubble
- [ ] Sender avatar tail on last outbound in group (§5.3)
- [ ] Outbound CSS tail notch (optional — deferred)

---

## 5. Composer (parity detail)

| Property | Web §6.7 | Native `composer.tsx` | Status |
|----------|----------|----------------------|--------|
| Outer container | `bg #f2f2f7`, `border-t`, `p-3` | Match | ✅ |
| Input pill radius | `22px` | `tavLayout.composerRadius: 22` | ✅ |
| Pill border | `zinc-200/90`, white fill, shadow-sm | Shadow + focus ring on `slabFocused` | ✅ |
| Attach button | `40×40`, Paperclip, `rounded-xl` | Lucide `Paperclip` | ✅ |
| Snippets (Tag) | v1 skip | Omitted | ⏸ |
| Textarea min height | 44px | `minHeight: 44` | ✅ |
| Send button | `40×40` circle, `#0a84ff`, disabled `zinc-300` | Match | ✅ |
| Placeholder | "Type a message…" | Match + caption variant | ✅ |
| Hint line | Shift+Enter… | "Send button to send · Enter for new line" | ✅ |
| Char counter | Red over 1600 | Red `counterOver` at 1600 | ✅ |
| Attachment preview | `rounded-lg border bg-zinc-50` | Preview tiles styled | ✅ |
| Press scale | 0.985 | `pressScaleStyle` on attach/send | ✅ |

---

## 6. Design token mapping

Extend `mobile/src/lib/theme.ts` — do not hardcode hex in components.

### 6.1 Colors

| Web token / Tailwind | Hex | `tavColors` key | Status |
|----------------------|-----|-----------------|--------|
| `--tav-bubble-out` | `#0a84ff` | `blue`, `bubbleOut` | ✅ |
| `--tav-bubble-out-hover` | `#0b76e8` | `blueHover` | ✅ (defined; unused) |
| `--tav-bubble-in` | `#e5e5ea` | `bubbleIn` | ✅ |
| `--tav-composer-slab` | `#f2f2f7` | `composerSlab` | ✅ |
| `--tav-chat-canvas` | `#ffffff` | `canvas`, `white` | ✅ |
| Thread list bg | `#f8f8f8` | `threadListBg` | ✅ |
| `--tav-messaging-link` | `#0a84ff` | `link` | ✅ |
| `zinc-50`–`zinc950` | Tailwind | `zinc50` … `zinc950` | ✅ |
| `red-600` (user avatar) | `#dc2626` | `red600` | ✅ |
| `emerald-500/600` | online, accept call | `emerald500`, `emerald600`, `emerald50`, `emerald100` | ✅ |
| `amber-50/500/800/900` | warnings, missed | `amber50`, `amber100`, `amber500`, `amber800`, `amber900` | ✅ |
| Outbound gradient stops | `#3498ff`, `#107eef` | `bubbleOutGradientTop/Mid/Bottom` | ✅ |
| Semantic green/red | delivered, failed | `green500`, `green100`, `red600`, `red50` | ✅ |

### 6.2 Typography

| Web role | Size / weight | Native style (`tavTypography`) | Status |
|----------|---------------|--------------------------------|--------|
| Message body | 16 / relaxed | `messageBody` | ✅ |
| Composer input | 14 / relaxed | `composerInput` | ✅ |
| Thread title | 14 semibold; unread bold | `threadTitle` / `threadTitleUnread` | ✅ |
| Thread snippet | 14; unread medium | `threadSnippet` | ✅ |
| Timestamp | 10–12 | `meta`, `metaSmall` | ✅ |
| Page title | 24 semibold | `pageTitle` | ✅ |
| Section title | 18 semibold | `sectionTitle` | ✅ |
| Empty state title | 18 semibold | `emptyTitle`, `emptyBody` | ✅ |

**Font family:** Geist Sans when `@expo-google-fonts/geist` lands; until then **system UI stack** (same as web inbox override). ⬜ Geist not loaded.

### 6.3 Layout constants (`tavLayout`)

| Token | Web | `tavLayout` | Status |
|-------|-----|-------------|--------|
| Header height | ~52–56 | `headerHeight: 52` | ✅ |
| Icon button | 40×40 | `iconButtonSize: 40` | ✅ |
| Send button | 40×40 circle | `sendButtonSize: 40` | ✅ |
| Composer radius | 22 | `composerRadius: 22` | ✅ |
| Bubble large radius | 20 | `bubbleRadiusLarge: 20` | ✅ |
| Bubble tail radius | 6 | `bubbleRadiusTail: 6` | ✅ |
| Avatar sm / md / lg | 32 / 40 / 48 | `avatarSm/Md/Lg` | ✅ |
| User avatar (header) | 32 | `userAvatar: 32` | ✅ |
| Inbox tile (switcher) | ~44 | `inboxTileLg: 44` | ✅ |
| Max bubble width | 92% | `maxBubbleWidthRatio: 0.92` | ✅ |

### 6.4 Shadows (approximate RN)

| Web | Native | Status |
|-----|--------|--------|
| `shadow-sm` | `tavShadows.sm` | ✅ |
| `shadow-md` | `tavShadows.md` | ✅ |
| `shadow-lg` / sheet | `tavShadows.lg` | ✅ |
| Composer focus | Border + `tavShadows.md` on focus | ✅ |

Helpers: `pressScaleStyle()`, `outboundBubbleRadii()`, `inboundBubbleRadii()` — ✅ in `theme.ts`.

---

## 7. Avatar & inbox identity

Web parity requires **deterministic hashing** — same inputs → same colors/icons on web and mobile.

### 7.1 Contact avatar (`ContactAvatar`) — ✅ Done

| Rule | Implementation |
|------|----------------|
| Input | E.164 phone (primary), display name for initials |
| Initials | First+last letter; else last 2 phone digits; else `??` |
| Color | 12 saturated hues from phone string hash |
| Sizes | sm 32, md 40, lg 48 |

**Files:** `mobile/src/lib/avatars/contact-avatar-utils.ts`, `mobile/src/components/avatars/contact-avatar.tsx`

### 7.2 Group contact avatar — ⏸ Deferred

Composite 2×2 quadrant layout for up to 4 members.

**v1 note:** Group MMS out of scope — build only if group threads appear in list.

### 7.3 User avatar (workspace) — ✅ Done

Always `red-600` + white initials — inbox header menu trigger.

**File:** `mobile/src/components/avatars/user-avatar.tsx`

**Gap:** Green online dot on avatar (web sidebar) — ⬜ not built.

### 7.4 Inbox visual tile (§4) — ✅ Done

| Rule | Implementation |
|------|----------------|
| Input | Inbox UUID |
| Pastel bg + icon color | 8 swatches, index = hash % 8 |
| Glyph | 8 Lucide icons, same index |
| Unread ring | 2px `#0a84ff` |
| Selected | 2px `zinc-900` border |

**Files:** `mobile/src/lib/inbox/inbox-visual-identity.ts`, `mobile/src/lib/hash/string-hash.ts`, `mobile/src/components/inbox/inbox-icon-tile.tsx` — used in `InboxSwitcherSheet`.

---

## 8. Icons — ✅ Done

| Web | Mobile |
|-----|--------|
| lucide-react | `lucide-react-native` via `components/icons/lucide.tsx` (per-icon imports) |
| Nav/header 20px | `size={20}` |
| Composer/status 16–18px | `size={16}`–`20` |
| Status icons §15 | CheckCheck, Check, Clock, X, AlertCircle at 14px in `message-status-icon.tsx` |

Text placeholders (`▾`, `⌕`, `☰`, `＋`) replaced in inbox header, composer, and conversation header. ✅

---

## 9. Supporting screens

All use **`SupportScreenShell`** on `zinc-50` unless noted.

### 9.1 Calls (`/(app)/calls`) — ✅ Done

| Web §9 | Mobile | Status |
|--------|--------|--------|
| Page title 24px + subtitle | Shell title only | 🟡 No in-content subtitle strip |
| Table in white card | FlatList card rows — `CallLogRow` | ✅ |
| Missed rows `amber-50/70` | `missedCard` background | ✅ |
| Status pills | `callStatusColors()` green/amber/red/blue | ✅ |
| Thread link blue | `tavColors.link` | ✅ |

Web uses HTML table; mobile uses list rows — same colors/density, not literal table. ✅ Acceptable.

### 9.2 Contacts (`/(app)/contacts`) — 🟡 Mostly done

| Web §10 | Mobile | Status |
|---------|--------|--------|
| Tab switcher white card | `ContactTabs` segmented, `zinc-100` selected | ✅ |
| External + Team only v1 | Saved groups hidden | ✅ |
| Add contact CTA | **v1 skip** (read-only) | ⏸ |
| Contact rows | `ContactRow` — hashed avatar, tag chips | ✅ |
| Message action | Blue-50 border button | 🟡 Whole row tap → compose (no separate button) |

### 9.3 Profile / Settings / Help — 🟡 Partial

| Web | Mobile | Status |
|-----|--------|--------|
| Stacked white cards `rounded-xl p-5` | Form sections in white cards | 🟡 Lighter shadow/radius than web |
| Inputs `rounded-lg border-zinc-300` | TextInput styles | 🟡 No focus blue ring yet |
| Settings toggles iOS style | Native `Switch`, blue track | 🟡 Not custom 48×28 dimensions |
| Help `<kbd>` chips | Plain text bullets | ⬜ |
| Inbox sidebar prefs | **v1 skip** | ⏸ |

### 9.4 Auth screens — 🟡 Mostly done

| Web §14 | Mobile | Status |
|---------|--------|--------|
| Login dark `zinc-950` + red glow | `(auth)/login` | ✅ |
| Frosted logo card | Text "TAV" mark in frosted card | 🟡 No SVG logo asset yet |
| Google button white h-48 | `GoogleSignInButton` | 🟡 Functional; not fully matched to web height/border |
| Pending light card | `AccountShell` pattern | ✅ |

---

## 10. Motion & interaction

| Web | Native approach | Status |
|-----|-----------------|--------|
| Button press 0.985 | `pressScaleStyle` on key `Pressable`s | 🟡 Not global on all pressables |
| Thread row stagger fade-in | Reanimated `entering` — low priority | ⬜ |
| Pane swish 300ms | Expo stack default slide | 🟡 Native transition only |
| Sheet scale-in | Modal `animationType="slide"` / `"fade"` | 🟡 |
| `prefers-reduced-motion` | `AccessibilityInfo.isReduceMotionEnabled` | ⬜ |
| Hover | Pressed state or long-press | ✅ |
| Swipe thread actions | Long-press `Alert` | ✅ |

---

## 11. Web-only → native substitute

| Web feature | v1 mobile substitute | Status |
|-------------|---------------------|--------|
| Desktop sidebar | User menu sheet | ✅ |
| Three-column inbox | Stack navigation | ✅ |
| Contact side panel | Skip | ⏸ |
| Search modal (⌘K) | Disabled icon / future screen | ✅ |
| Snippets / Tag in composer | Omit | ⏸ |
| Drag-drop overlay | Attach sheet only | ✅ |
| Sonner toasts | `Alert.alert` | ✅ |
| Hover row actions | Long-press menu | ✅ |
| Collapsible thread list rail | N/A | — |
| Chat / team view | Out of scope | ⏸ |
| Bug report / dev dashboard | Out of scope | ⏸ |
| In-call header pill | `InCallOverlay` modal | 🟡 Different layout, same controls |

---

## 12. v1 scope filter

Implement design parity **only for shipped v1 features** (see `IMPLEMENTATION_PLAN.md`):

| In scope | Design priority | Status |
|----------|-----------------|--------|
| Auth + onboarding + pending/rejected | P1 — login dark hero | 🟡 Login ✅; Google button polish pending |
| Inbox list + conversation + composer | **P0** | ✅ |
| MMS attachments | P0 — bubble media styling | ✅ |
| Inbox switcher + user menu | P0 | ✅ |
| Empty + request access states | P1 | ✅ |
| Contacts read-only | P1 | 🟡 |
| Profile, Settings, Help | P2 | 🟡 |
| Calls history + voice UI | P2 (Phase 12) | 🟡 History ✅; in-call overlay 🟡 |
| Push / in-app banners | P2 — OS notifications | ✅ Minimal in-app chrome |

| Out of scope (defer design work) |
|----------------------------------|
| Chat, snippets, global search |
| Group MMS UI |
| Side panel / deal fields |
| Contacts CRUD, saved groups tab |
| Dev dashboard, bug report |
| Inbound CallKit UI (until Phase 12.4) |

---

## 13. Identity anchors checklist

Use before marking a design pass complete:

| # | Anchor | Target | Status |
|---|--------|--------|--------|
| 1 | Outbound blue gradient / `#0a84ff` | Gradient or exact blue | ✅ `LinearGradient` |
| 2 | Inbound gray `#e5e5ea` | Exact | ✅ |
| 3 | Composer slab `#f2f2f7` | Exact | ✅ |
| 4 | Red user avatar in nav | `red-600` circle | ✅ `UserAvatar` |
| 5 | Hashed contact avatars | 40px in thread list | ✅ |
| 6 | Pastel inbox tiles | Switcher sheet | ✅ |
| 7 | Zinc chrome | white + zinc borders | ✅ |
| 8 | Unread blue accent | Left border + dot | ✅ |
| 9 | Thread list density | 2-line preview, 40px avatar | ✅ |
| 10 | Composer pill + blue send | 22px pill, 40px send | ✅ |
| 11 | Segmented tabs | White selected chip | ✅ |
| 12 | Empty states | Icon circle variants | ✅ |
| 13 | Lucide icons | Consistent set | ✅ |

**Remaining before “design pass complete”:** compose screen restyle (§3.4), conversation lg avatar, failed retry pill, supporting-screen card polish, Geist font (optional), motion layer (optional).

---

## 14. Suggested implementation order

| # | Task | Status |
|---|------|--------|
| 1 | **Tokens** — extend `theme.ts` | ✅ |
| 2 | **Icons** — `lucide-react-native` + wrapper | ✅ |
| 3 | **Avatars** — hash helpers + `ContactAvatar` + `UserAvatar` | ✅ |
| 4 | **Inbox identity** — pastel tiles in switcher | ✅ |
| 5 | **Thread list** — bg, avatars, unread border, tabs | ✅ |
| 6 | **Bubbles** — gradient, radii, timestamps, grouping | 🟡 Retry pill + sender tail pending |
| 7 | **Composer** — attach icon, hint, counter, press scale | ✅ |
| 8 | **Inbox header** — unread pill, red avatar, icons | ✅ |
| 9 | **Conversation header** — back label, lg avatar, call styling | 🟡 lg avatar + in-call pill layout |
| 10 | **Empty states** — all §7 variants | ✅ |
| 11 | **Auth login** — dark hero restyle | ✅ |
| 12 | **Supporting screens** — card/input/tab polish | 🟡 |
| 13 | **Calls rows** — amber missed, status pills | ✅ |
| 14 | **Compose screen** — §3.4 card restyle | ⬜ |
| 15 | **Motion polish** — global press scale, list animations | ⬜ |

---

## 15. File ownership map

| Area | Primary files |
|------|---------------|
| Tokens | `mobile/src/lib/theme.ts` |
| Inbox header | `components/inbox/inbox-header.tsx` |
| Thread list | `inbox/index.tsx`, `thread-row.tsx`, `thread-tabs.tsx` |
| Conversation | `inbox/[threadId].tsx`, `conversation-header.tsx` |
| Bubbles | `message-bubble.tsx`, `message-status-icon.tsx`, `message-list.tsx` |
| Composer | `composer.tsx`, `use-composer-attachments.ts` |
| Sheets | `inbox-switcher-sheet.tsx`, `user-menu-sheet.tsx` |
| Avatars | `components/avatars/*`, `lib/avatars/contact-avatar-utils.ts` |
| Inbox tiles | `lib/inbox/inbox-visual-identity.ts`, `components/inbox/inbox-icon-tile.tsx` |
| Icons | `components/icons/lucide.tsx` |
| Supporting shell | `workspace/support-screen-shell.tsx` |
| Auth | `(auth)/login.tsx`, `components/auth/*` |
| Calls | `calls/index.tsx`, `call-log-row.tsx` |
| Voice overlay | `voice/in-call-overlay.tsx`, `thread-voice-call-controls.tsx` |
| Compose (restyle pending) | `inbox/compose.tsx` |

---

## 16. Acceptance criteria

A screen passes mobile-first design review when:

1. Colors match §6.1 hex values (visual diff vs web mobile viewport at 390px width).
2. Typography hierarchy matches §2.2 roles (sizes/weights, not necessarily Geist).
3. Spacing within ±2px of web mobile for key elements (avatar 40, send 40, composer 22 radius).
4. No text-character placeholders where Lucide icons exist on web.
5. Unread/selected/warning states use the same semantic colors as web.
6. Layout follows §2–3 (no sidebar; inbox owns header; supporting screens use shell).
7. Out-of-scope web features are absent, not half-styled.

---

*Companion to [`docs/web-design-flow.md`](./web-design-flow.md). Last progress update: 2026-07-23.*
