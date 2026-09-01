# Security

## Authentication & sessions

- Passwords are hashed with `bcryptjs`, cost factor 12 (`app/api/auth/register/route.ts`).
- Sessions are a signed JWT (`jose`, HS256) in an `httpOnly`, `sameSite=lax` cookie, `secure` when `NODE_ENV=production` (`lib/auth.ts`). The JWT payload is only a `userId`; user data is always re-fetched from the database on each request, so revoking a user's `role` or deleting their account takes effect immediately without waiting for token expiry.
- `AUTH_SECRET` must be a long random value in production. `lib/auth.ts` falls back to a hardcoded development secret if unset — **this must never happen in production**; the app has no separate startup check for this today (see "Known gaps" below).

## Tenant isolation (IDOR protection)

Every write path re-derives ownership from the database rather than trusting client-supplied IDs:

- Asset/document/booking creation all verify `property.ownerId === currentUser.id` before touching a `propertyId` supplied by the client.
- Room references are checked against the specific property (`room.propertyId === propertyId`) so a user cannot attach a device to a room from a different home.
- Maintenance completion (`app/maintenance/actions.ts`) scopes its `findFirst` through `asset.property.ownerId`, so a user cannot complete another user's maintenance event even with a guessed ID.

This was verified end-to-end in production: a fresh test account could only ever see/act on its own property, rooms, and assets.

## File uploads

`lib/storage.ts` enforces an allow-list (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) and a 10MB size cap server-side, independent of any client-side `accept` attribute. Uploaded files are stored under a per-user scoped path and are never exposed as public URLs — the app has no route that serves raw storage keys back as a URL.

**Production note:** `lib/storage.ts` now includes an S3-compatible provider (works with Cloudflare R2 or AWS S3) that activates automatically when `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY` are set (see DEPLOYMENT.md). **Until those env vars are configured in Vercel, the app silently falls back to local disk**, which is ephemeral there — files will not survive a redeploy. Deleting a document now also deletes the underlying stored file (previously only the database row was removed, leaking orphaned files).

## Invoice QR verification (ZATCA)

`lib/zatca.ts` attempts to decode a Saudi e-invoice QR code (the standard ZATCA/Fatoora base64 TLV payload) from an uploaded invoice photo before falling back to AI vision. When found, the QR-derived seller name/VAT amount/total/date are treated as authoritative (they come from the invoice issuer's own signed record, not a model guess) and override the AI-extracted values for those fields; the response is flagged `verifiedByZatca: true`. Decoding failure or a missing QR never blocks the request — it silently falls through to the existing Gemini/OpenAI extraction, consistent with the "AI errors must not block progress" rule elsewhere in the app.

## Secrets

- `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, `OPENAI_API_KEY` are read only from `process.env`, never hardcoded, and `.env` is gitignored (only `.env.example` with placeholders is committed).
- `/api/health` and `/api/ai/health` were audited to confirm they report booleans/enums (`keyConfigured: true`, `provider: "gemini"`) and never the key values themselves.
- Server logs (`console.error`/`console.info`) for AI provider failures log status codes and truncated response bodies, never the API key.

## Rate limiting

`lib/rateLimit.ts` provides a lightweight in-memory limiter, applied to:
- `/api/auth/login` — 10 attempts / 5 min per IP
- `/api/auth/register` — 5 attempts / 15 min per IP
- `/api/ai/scan-asset` and `/api/ai/scan-document` — 20 scans / 10 min per authenticated user

**Caveat:** this is per-serverless-instance, in-memory state — Vercel does not guarantee one instance handles all requests from a given IP/user, so it's a best-effort speed bump against a single hot instance being hammered, not a hard distributed guarantee. For a stronger guarantee, replace it with a shared store (e.g. `@upstash/ratelimit` backed by Upstash Redis) — the call sites (`rateLimit(key, limit, windowMs)`) are already isolated to one function per route, so swapping the implementation is a one-file change.

## Known gaps / recommended next steps
- **No production startup check for `AUTH_SECRET`.** Add a boot-time assertion that fails the deploy if `AUTH_SECRET` is unset or equals the development fallback.
- **No CSRF token on the native `<form method="post">` routes** (`/api/assets`, `/api/rooms`, `/api/properties`). Risk is mitigated by `sameSite=lax` cookies (blocks cross-site POST from a third-party page's auto-submitting form in modern browsers) and same-origin form actions, but this relies entirely on cookie `sameSite` behavior rather than an explicit token. Acceptable for now; revisit if the app adds a public API surface with cross-origin form posts.
- **`npm audit` reports 5 dev-tooling advisories** (PostCSS source-map handling used by Next's build pipeline; `deepmerge-ts` used by the Prisma CLI's config loader). Both require a major-version bump (Next 16, older Prisma) to clear automatically. Neither is reachable via user-supplied input in this app (no user-authored CSS or Prisma config is ever processed at runtime), so a forced major upgrade was deliberately deferred rather than applied blindly before a release — re-evaluate when Next 16 is otherwise on the upgrade path.
- **Family member roles exist in the schema** (`PropertyMember`, `Role.FAMILY_MEMBER`) **but are not yet enforced anywhere** — every ownership check today is `ownerId === user.id` only, with no `PropertyMember` fallback. Do not expose an "invite family member" UI until the permission checks are extended to also accept a matching `PropertyMember` row.

## Reporting

This is an internal project; report issues directly to the maintainer rather than a public tracker.
