# PDF / file attachments — product analysis

**Created:** 2026-08-10  
**Context:** Request to let workers send files (especially PDFs) from the **+** compose flow on mobile — for both the **Text** tab (customer SMS) and **Chats** tab (teammates).

This document captures the analysis only. No implementation was done.

---

## Question

Workers often work with PDF files. Should the app allow sending files/PDFs from the **+** button (new message flow) on:

1. **Text tab** — message a phone number / contact (SMS/MMS to customers)
2. **Chats tab** — message teammates (internal chat)

---

## Current behavior (mobile)

| Surface | + / compose flow | Attachments today |
|---------|------------------|-------------------|
| **Text** (`inbox/compose`, thread composer) | Pick number, text, send | Camera + gallery — **images and short video only** |
| **Chats** (`chat/[conversationId]`) | DM or group with teammates | **Images only** (enforced in `validateChatComposerFiles`) |

**Relevant code / docs:**

- SMS/MMS policy: `mobile/src/lib/messaging/mms-policy.ts` — no PDF; carrier-safe types only
- Chat validation: `mobile/src/lib/chat/messages.ts` — `Only image attachments are supported in chat.`
- Web SMS send spec: `docs/image-sending-flow-website.md` — PDF explicitly rejected server-side
- Internal chat flow: `flows/09-internal-chat.md`

---

## Text tab → customers (SMS/MMS)

### Verdict: **Do not add PDF/file attach for customer SMS**

### Why

1. **Intentional product limit** — Mobile and production web inbox only allow carrier-safe MMS types (JPEG, PNG, GIF, WebP, MP4, MOV, etc.). PDF is blocked on the **server**, not just in the UI.

2. **Carrier / channel reality** — US/Canada SMS/MMS does not reliably deliver PDFs or office documents to customer phones. Twilio may accept an upload, but delivery to the recipient is not dependable.

3. **Bad worker experience** — Adding a “Files” option on Text would let workers pick a PDF, believe it sent, then hit an API error or leave the customer with nothing useful.

4. **Not fixable by mobile UI alone** — Would require backend + product changes, and MMS would still be an unreliable document channel.

### What workers can do instead (customer PDFs)

- Send a **link** in the SMS body (“Your PDF: https://…”)
- Use **email** for documents
- Keep using **images** on Text when a photo of a doc is enough (already supported)

### Images on Text tab

**Already supported** — photos from camera/gallery are the correct MMS use case.

---

## Chats tab → teammates (internal chat)

### Verdict: **Good idea — PDF/files belong here**

### Why

1. **Different channel** — Internal chat uploads go to Supabase Storage via `/api/chat/*`. No SMS carrier involved; teammates open files in-app or in the browser.

2. **Real business need** — Sharing invoices, forms, vehicle docs between coworkers is a normal workflow and fits internal chat.

3. **Web is ahead of mobile** — Production web chat supports richer attachments (including PDF in lightbox/gallery flows). Mobile chat is artificially limited to images today.

4. **Reasonable scope** — Main work is mobile-side: document picker, relaxed validation, UI for non-image files (filename tile + tap to open), parity with web limits.

### Likely requirements (when implementing later)

- Allow PDF (and possibly other doc types) in chat file validation
- **Document picker** (e.g. `expo-document-picker`) — may require **dev client rebuild** if not already in the project
- Display non-images as **filename tiles**, not only image thumbnails
- Align limits with web (e.g. max **5 files**, **~10–25 MB** each; mobile chat images already cap at 25 MB)

### Rebuild note

UI-only changes = Fast Refresh. Adding native document-picker module = **rebuild dev client**.

---

## Summary table

| Tab | Audience | PDF / documents | Recommendation |
|-----|----------|-----------------|----------------|
| **Text** | Customers (SMS/MMS) | PDF | **No** — use link or email |
| **Text** | Customers (SMS/MMS) | Images | **Already supported** |
| **Chats** | Teammates | PDF / files | **Yes** — implement when ready |

---

## Recommended order (if pursued later)

1. **Chats tab** — PDF + file attachments for teammates (high value, technically sound)
2. **Text tab** — Do **not** add PDF over MMS; if customer documents are critical, design a **link-based or email-based** flow instead

---

## Open questions for later

- Which file types beyond PDF does web chat allow? (Confirm against production `/api/chat/...` validation before mobile parity.)
- Should Text tab + ever offer “Share link” helper for hosted PDFs, or is that out of scope?
- Do workers need PDF on **existing thread composer** (Text) or only on **new compose (+)**? (Same MMS limits apply either way.)
