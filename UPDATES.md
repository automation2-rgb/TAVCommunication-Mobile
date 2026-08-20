# TAV Communication Mobile — Suggested Updates

Suggested improvements for the mobile app: polish, UX, new features, and navigation.  
Organized by type so you can pick what to build next.

**Status legend:** ⬜ Not started · 🟡 In progress · ✅ Done · ⏸ Deferred

---

## Summary

| Type | What it means | Count |
|------|----------------|-------|
| **Design only** | Same features, better look and feel | 7 |
| **UX / interaction** | Easier to use what already exists | 8 |
| **New features** | Capabilities the app does not have yet | 6 |
| **Navigation / structure** | Where things live in the app | 4 |
| **Professional finish** | Typography, accessibility, code health | 5 |

---

## Recommended priority (best ROI first)

| # | Item | Type | Section |
|---|------|------|---------|
| 1 | Text tab unread badge | UX | §2.1 |
| 2 | Action sheets instead of alerts | UX | §2.3 |
| 3 | Failed message retry pill | UX | §2.2 |
| 4 | Compose screen restyle | Design | §1.6 |
| 5 | Skeleton loaders (thread list, conversation, calls) | Design | §1.2 |
| 6 | Snippets / canned responses | Feature | §3.1 |
| 7 | Full-screen in-call UI | Design | §1.7 |
| 8 | Long-press copy message / phone number | UX | §2.5 |

---

## 1. Design only (look and feel)

Same functionality — more professional, consistent presentation.

| Status | # | Update | Detail |
|--------|---|--------|--------|
| ⬜ | 1.1 | **Loading skeletons** | Replace centered spinners with gray placeholder rows (avatar + two lines) on thread list, conversation, and call history. Search modal already has skeletons — extend that pattern. |
| ⬜ | 1.2 | **Compose screen restyle** | `inbox/compose` is functional but not fully styled. Match conversation header: recipient chip, cleaner search field, card layout. Ref: `docs/mobile-first-layout.md` §3.4. |
| ⬜ | 1.3 | **Conversation header — larger avatar** | Bump avatar from 40px (`md`) to 48px (`lg`) in conversation header for more presence. Ref: design doc identity anchors. |
| ⬜ | 1.4 | **Lucide icon for pending attachments** | Replace 📎 emoji in pending attachment tiles with `Paperclip` icon for Lucide consistency. |
| ⬜ | 1.5 | **Geist or Inter font** | Load Geist (web parity) or Inter via `@expo-google-fonts` for tighter typography on titles and thread names. Currently deferred in implementation plan. |
| ⬜ | 1.6 | **Full-screen in-call UI** | Upgrade in-call overlay from centered card modal to full-screen call layout: large contact name, elapsed timer, circular mute/hang-up buttons, optional “Return to conversation.” |
| ⬜ | 1.7 | **Inline success/error toasts** | Use bottom snackbars for “Profile saved,” “Marked done,” etc. instead of blocking `Alert.alert` for non-critical feedback. Profile screen already uses inline messages — extend app-wide. |
| ⬜ | 1.8 | **Supporting screen card polish** | Profile, Settings, Help cards/inputs/toggles — align spacing, borders, and section headers with web mobile. Ref: `docs/mobile-first-layout.md` §9. |
| ⬜ | 1.9 | **Empty states with CTAs** | Add primary buttons on empty states: “Start a conversation,” “Request inbox access,” “Enable notifications” instead of text-only dead ends. |
| ⬜ | 1.10 | **Global press scale + list motion** | Apply `pressScaleStyle` consistently; optional Reanimated list enter animations. Ref: `docs/mobile-first-layout.md` §10. |

---

## 2. UX / interaction (easier daily use)

Not new features — faster, clearer use of what exists today.

| Status | # | Update | Detail |
|--------|---|--------|--------|
| ⬜ | 2.1 | **Text tab unread badge** | Show total SMS unread count on the Text tab. Calls and Chats tabs already have badges; Text tab does not. High impact for multi-inbox workers. |
| ⬜ | 2.2 | **Failed message retry pill** | Tap-to-retry on failed/undelivered outbound bubbles. Web has this; mobile styles failed state but offers no retry action. |
| ⬜ | 2.3 | **Action sheets instead of alerts** | Replace `Alert.alert` menus with bottom sheets + icons for: contact actions (Message / Text / Call), thread long-press menu, non-critical errors. |
| ⬜ | 2.4 | **Swipe left for read/unread** | Swipe-right already marks Done/Reopen. Add swipe-left for mark read/unread (iOS Mail pattern) to reduce long-press usage. |
| ⬜ | 2.5 | **Long-press message actions** | Copy message text, copy phone number, optional “Call this number” from bubble long-press. |
| ⬜ | 2.6 | **Haptic feedback** | Light haptics on send, swipe-to-done, tab switch, call connect/disconnect. |
| ⬜ | 2.7 | **Offline / reconnect banner** | Slim top banner when network is unavailable: “No connection — messages will send when back online.” Helps when MMS or send hangs on weak signal. |
| ⬜ | 2.8 | **Visual “Done deal” on thread rows** | Muted row style or small archive badge so closed deals are obvious and workers don’t reply by mistake. |
| ⬜ | 2.9 | **Inbox name in search results** | When search spans inboxes, show which inbox each result belongs to (e.g. “Transportation · John Smith”). |

---

## 3. New features (new capabilities)

Things the app cannot do today — higher effort, high worker value.

| Status | # | Update | Detail |
|--------|---|--------|--------|
| ⬜ | 3.1 | **Snippets / canned responses** | Insert preset replies (“On my way,” “Please send VIN,” etc.) from composer. Highest-value new feature for dealership staff. Requires web API parity. Ref: post-v1 backlog, `flows/06-search-snippets-side-panel.md`. |
| ⬜ | 3.2 | **Read-only deal / customer context** | Collapsible “Deal info” strip on conversation (vehicle, stage, notes) — read-only from web side panel data. Reduces alt-tabbing to web mid-text. |
| ⬜ | 3.3 | **Rich push notification actions** | Mark read or quick reply from notification without fully opening app. iOS/Android notification categories. |
| ⬜ | 3.4 | **Pin / star important threads** | Pin 2–3 hot deals at top of Active tab, separate from Done filtering. |
| ⬜ | 3.5 | **Recent search queries** | Persist recent search terms in global search modal (in addition to recent threads already loaded on open). |
| ⬜ | 3.6 | **Inbound voice calls** | Answer ringing calls in app (CallKit / ConnectionService). Outbound + history exist; inbound deferred. Ref: `IMPLEMENTATION_PLAN.md` Phase 12.4. |

---

## 4. Navigation and structure

Same screens — clearer organization.

| Status | # | Update | Detail |
|--------|---|--------|--------|
| ⬜ | 4.1 | **Profile tab as hub** | Consolidate Settings, Help, and Sign out under Profile. Reduce five-tab cognitive load; Settings/Help stay as nested routes from Profile only. |
| ⬜ | 4.2 | **Remove or repurpose `UserMenuSheet`** | Component exists but is no longer wired after bottom tab nav. Delete dead code, or add avatar button on inbox header for quick account shortcuts. |
| ⬜ | 4.3 | **Tab label clarity** | Consider renaming “Text” → “Inbox” or “SMS” for dealership staff mental model. Quick user test with 2–3 workers. |
| ⬜ | 4.4 | **Active inbox indicator on Text tab** | Optional: subtle dot or inbox initials under Text tab showing which line is active when switching inboxes often. |

---

## 5. Professional finish (quality and maintainability)

| Status | # | Update | Detail |
|--------|---|--------|--------|
| ⬜ | 5.1 | **Reduce motion support** | Respect `AccessibilityInfo.isReduceMotionEnabled` — disable press scale / list animations when user prefers reduced motion. Ref: `docs/mobile-first-layout.md` §10. |
| ⬜ | 5.2 | **TypeScript cleanup** | Fix TS errors before EAS/TestFlight: Lucide import paths, tab bar prop types, deprecated `delayPressIn` on `Pressable`. |
| ⬜ | 5.3 | **Device QA matrix** | Complete Phase 10 test matrix on physical iOS + Android before closed testing. Ref: `IMPLEMENTATION_PLAN.md` §10. |
| ⬜ | 5.4 | **iOS parity** | MMS, push, voice outbound on TestFlight — Android dev build verified; iOS pending distribution builds. |
| ⬜ | 5.5 | **Update `mobile-first-layout.md`** | Sync progress table with current app (bottom tabs, chat, calls, search shipped; compose restyle still pending). |

---

## What is *not* just design

For clarity when prioritizing:

| If you only want **design** | Start with §1.1–1.7 (skeletons, compose, call UI, toasts, fonts) |
| If you want **worker productivity** | Start with §2.1–2.3, §3.1 (badge, retry, action sheets, snippets) |
| If you want **parity with web** | §3.1 snippets, §3.2 deal context, §3.6 inbound calls |

---

## Related docs

| Topic | Doc |
|-------|-----|
| Design mapping | `docs/mobile-first-layout.md` |
| Implementation phases | `IMPLEMENTATION_PLAN.md` |
| Web visual spec | `docs/web-design-flow.md` |
| Search parity | `docs/webapp-search-flow.md` |
| Snippets (web) | `flows/06-search-snippets-side-panel.md` |
| Voice calls | `docs/calls-flow.md`, `IMPLEMENTATION_PLAN.md` Phase 12 |

---

*Created: 2026-08-20 · Source: mobile app review suggestions*
