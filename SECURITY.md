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

**Production note:** the current storage provider writes to the local filesystem (`.data/uploads`), which is ephemeral on Vercel — files will not survive redeploys or across serverless instances. This is called out explicitly in `lib/storage.ts` and must be swapped for an S3/R2-compatible adapter before the Document Vault is relied on in production. The `StorageProvider` interface already isolates callers from this, so swapping the implementation doesn't require touching `documents/actions.ts`.

## Secrets

- `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, `OPENAI_API_KEY` are read only from `process.env`, never hardcoded, and `.env` is gitignored (only `.env.example` with placeholders is committed).
- `/api/health` and `/api/ai/health` were audited to confirm they report booleans/enums (`keyConfigured: true`, `provider: "gemini"`) and never the key values themselves.
- Server logs (`console.error`/`console.info`) for AI provider failures log status codes and truncated response bodies, never the API key.

## Known gaps / recommended next steps

- **No rate limiting.** Login, registration, and AI-scan endpoints have no request throttling. Recommend adding IP/user-based rate limiting (e.g. Vercel's built-in protections, or `@upstash/ratelimit`) before wider launch, particularly on `/api/auth/login` (credential stuffing) and the AI scan endpoints (cost control against a paid Gemini/OpenAI key).
- **No production startup check for `AUTH_SECRET`.** Add a boot-time assertion that fails the deploy if `AUTH_SECRET` is unset or equals the development fallback.
- **No CSRF token on the native `<form method="post">` routes** (`/api/assets`, `/api/rooms`, `/api/properties`). Risk is mitigated by `sameSite=lax` cookies (blocks cross-site POST from a third-party page's auto-submitting form in modern browsers) and same-origin form actions, but this relies entirely on cookie `sameSite` behavior rather than an explicit token. Acceptable for now; revisit if the app adds a public API surface with cross-origin form posts.
- **`npm audit` reports 5 dev-tooling advisories** (PostCSS source-map handling used by Next's build pipeline; `deepmerge-ts` used by the Prisma CLI's config loader). Both require a major-version bump (Next 16, older Prisma) to clear automatically. Neither is reachable via user-supplied input in this app (no user-authored CSS or Prisma config is ever processed at runtime), so a forced major upgrade was deliberately deferred rather than applied blindly before a release — re-evaluate when Next 16 is otherwise on the upgrade path.
- **Family member roles exist in the schema** (`PropertyMember`, `Role.FAMILY_MEMBER`) **but are not yet enforced anywhere** — every ownership check today is `ownerId === user.id` only, with no `PropertyMember` fallback. Do not expose an "invite family member" UI until the permission checks are extended to also accept a matching `PropertyMember` row.

## Reporting

This is an internal project; report issues directly to the maintainer rather than a public tracker.
