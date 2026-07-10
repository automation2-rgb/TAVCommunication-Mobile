# MMS native rebuild — deferred task

Use this doc when ready to rebuild the Android dev client for **client-side image compression** (web parity). Drag it into chat so the agent knows the full context.

**Status (2026-07-10):** Rebuild **deferred** — MMS send + inline display work without it. Compression skipped until native module is in the APK.

---

## Why rebuild?

`expo-image-manipulator` is a **native module**. It was added to `package.json` but the current debug APK was built **before** it was linked.

| Without rebuild (now) | With rebuild |
|---|---|
| MMS send works (`attachment` field fix) | Same |
| Inline images display in app (`size_bytes` fix) | Same |
| No compression — full-size photos upload | **Web-parity compression** (~600 KB JPEG, max edge 1600px) |
| `ExpoImageManipulator` error if compression runs | No manipulator error |
| Recipients may get carrier **link** fallback on large photos | Lower chance of link fallback |

**Not required for:** sign-in, inbox, push, Phase 8 contacts, or normal Metro reload dev.

**Do before:** wider tester rollout, or if recipients consistently get `https://` links instead of inline MMS.

---

## Already done (no rebuild needed)

These JS fixes are live via Metro reload — **do not redo**:

| Fix | File(s) |
|---|---|
| Multipart field `attachment` (not `files`) | `mobile/src/lib/messaging/mms-upload.ts` |
| 4 MB limit + strict MIME allowlist | `mobile/src/lib/messaging/mms-policy.ts` |
| Lazy MMS upload import (no startup crash) | `mobile/src/lib/api-client.ts` |
| 60s MMS upload timeout | `mobile/src/lib/messaging/mms-upload.ts` |
| Send response + `thread_id` lookup | `mobile/src/lib/messaging/send-message.ts` |
| Attachment column `size_bytes` (not `byte_size`) | `message-attachments.ts`, `types/messaging.ts` |
| Pending preview → real message id after send | `inbox/[threadId].tsx` |

Reference: [`docs/image-sending-flow-website.md`](./image-sending-flow-website.md)

---

## Package already installed

```json
"expo-image-manipulator": "~56.0.21"
```

Compression logic exists but is **not wired** in `prepareUploadFile`:

- **Ready:** `mobile/src/lib/messaging/compress-image.ts` (dynamic import, web-like targets)
- **Disabled in:** `mobile/src/lib/messaging/mms-upload.ts` — uploads raw file from picker

---

## After rebuild: re-enable compression

In `mobile/src/lib/messaging/mms-upload.ts`, inside `prepareUploadFile`:

1. Import `compressOutboundImage` from `@/lib/messaging/compress-image`
2. Before reading `new File(file.uri)`, call:

```ts
const compressed = await compressOutboundImage({
  uri: file.uri,
  name,
  mimeType: fallbackMimeType,
  sizeBytes: undefined,
});
const source = new File(compressed.uri);
// use compressed.name / compressed.mimeType; call compressed.cleanup() in PreparedUploadFile.cleanup
```

3. Test image-only send — no `ExpoImageManipulator` error
4. Confirm recipient gets inline MMS (not `p.twil.io` link) on a large camera photo

---

## How to rebuild (Windows)

### Prerequisites

| Item | Value |
|---|---|
| Java | **17+** — not system Java 8 |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio1\jbr` |
| Android SDK | `C:\Users\UseR\AppData\Local\Android\Sdk` |
| `local.properties` | `mobile/android/local.properties` → `sdk.dir=...` (already created) |

### Commands

PowerShell, from repo:

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio1\jbr"
$env:ANDROID_HOME="C:\Users\UseR\AppData\Local\Android\Sdk"
cd C:\Users\UseR\Desktop\TAVCommunication-mobile\mobile
npx expo run:android
```

- **Emulator can stay open** — install happens at the end
- **Do not** rely on Metro reload alone for this step
- **Expected time:** ~10–15 min incremental; up to ~25 min cold

### If build fails

| Error | Fix |
|---|---|
| `Gradle requires JVM 17` | Set `JAVA_HOME` to Android Studio `jbr` (see above) |
| `SDK location not found` | Ensure `mobile/android/local.properties` has `sdk.dir` |
| `Filename longer than 260 characters` | Run build from a normal terminal (not sandbox); use `GRADLE_USER_HOME=C:\Users\UseR\.gradle` |
| `ExpoImageManipulator` after rebuild | Run `npx expo prebuild --clean` only if autolinking is broken (last resort) |

---

## Verify after rebuild

1. Sign in — no red screen on launch or after sign-in
2. Send **image only** (no caption) — no manipulator error
3. **In app:** thumbnail shows inline (not empty checks-only bubble)
4. **Web inbox:** same message shows inline image
5. **Recipient phone:** prefer inline MMS over SMS link (test with a large photo)
6. Optional: compare upload size in network logs — should be smaller after compression

---

## Optional: EAS preview build

For TestFlight / Play closed testing (Phase 9), also upload Firebase service account to EAS and run:

```bash
eas build --profile preview --platform android
```

Compression module must be in that build too — same `expo-image-manipulator` dependency.

---

## Agent checklist (paste with this file)

When user drops this doc:

- [ ] Confirm `expo-image-manipulator` in `package.json`
- [ ] Re-wire `compressOutboundImage` in `mms-upload.ts` if still disabled
- [ ] Run rebuild with correct `JAVA_HOME` + SDK
- [ ] Do **not** revert `attachment` field, `size_bytes`, or lazy `api-client` import
- [ ] Update `IMPLEMENTATION_PLAN.md` Phase 6 compression row when done
- [ ] Test matrix row 10.1.7 (MMS photo send/receive)

---

*Created: 2026-07-10 · Deferred until post–Phase 8 or pre-distribution*
