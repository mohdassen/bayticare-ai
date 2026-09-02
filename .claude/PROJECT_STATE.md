# Project State

Last updated: 2026-09-02 (growth-features batch)

## Current state

Stable, deployed, verified live at https://bayticare-ai.vercel.app. Core loop (register → property → room → asset wizard → maintenance → documents → services → expenses) works end-to-end, verified via real browser smoke tests against production, not just build checks.

## Working

- Auth, session, ownership-scoped queries on every page.
- Gemini asset/document AI scanning (real provider, not mock, in prod) with manual-fallback always available.
- ZATCA e-invoice QR verification layered under the AI document scan (`lib/zatca.ts`).
- Deterministic Home Health Score with actionable per-asset reasons+CTAs on the dashboard.
- Rate limiting on login/register/AI-scan endpoints (in-memory, per-instance — see DECISIONS.md).
- Document Vault with property/asset/category filters; S3/R2 storage adapter built (see Blockers).
- CI (typecheck/lint/test/build) green on every push; `npm run build` succeeds locally and on Vercel.
- Redesigned nav (grouped sidebar, active-state highlighting) + global "Quick Capture" FAB making AI scanning reachable from any page — verified visually via screenshot on desktop + mobile viewport.
- Growth-features batch (this update): emergency-booking button (`/services?urgent=1`), Home Passport printable property report (`/properties/[id]/passport`), asset detail page + printable QR label (`/assets/[id]`, `/assets/[id]/label`, needs `qrcode` pkg), monthly Home Health Report (`/reports`, `/api/cron/monthly-report`, `vercel.json` cron, `lib/email.ts` — inert until `RESEND_API_KEY`+`CRON_SECRET` set), referral program (`/referrals`, `?ref=` capture on register), provider ratings (`submitReview` in `services/actions.ts`). Referral/rating features need `Referral`/`ProviderReview` tables pushed to production — see Blockers.

## Not started / known gaps

- Family access: `PropertyMember`/`Role.FAMILY_MEMBER` exist in the Prisma schema but **no ownership check consults them** — every check is still `ownerId === user.id` only. Do not expose an "invite family member" UI before extending the ownership checks in `assets`, `rooms`, `documents/actions.ts`, `services/actions.ts`.
- Subscription entitlements (Free/Plus/Family limits) not enforced — needs a `plan` field on `User`, which needs a reviewed migration (see Blockers).
- No notifications (email/WhatsApp) — warranty/maintenance alerts are in-app dashboard copy only.
- `diagnoseIssue` (`app/ai/actions.ts`) is a stub returning canned text, not a real AI call — ambiguous whether that's intentional (safety-first) or an unfinished feature; flag to the user before changing.
- Provider-owner/technician booking workflow: schema supports the full status machine, no UI for a provider to transition a booking past customer create/cancel.

## Recent important change

UX/IA overhaul (2026-09-02): AI-first dashboard hero, global quick-capture FAB, grouped+active-state sidebar, Tajawal Arabic webfont. Driven by direct user feedback that the product felt "primitive and unorganized" and that AI wasn't central.

## Next action

1. **Run `npx prisma db push` against production** (needs `DATABASE_URL`) to activate the referral program and provider ratings — code is already deployed and defensively degrades until then.
2. User needs to configure real Cloudflare R2 credentials in Vercel (`STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY`) — the adapter is ready, just not activated in prod yet.
3. User needs `RESEND_API_KEY` + `EMAIL_FROM` + `CRON_SECRET` in Vercel to activate the monthly report email (both scheduled and the manual "send now" button).
4. Family access enforcement (no migration needed, `PropertyMember` table already exists).

## Blockers

- No production `DATABASE_URL`/Vercel dashboard access from this session — can't run `prisma db push` (needed for Referral/ProviderReview tables), can't inspect Vercel build/runtime logs directly (verification is done via HTTP polling + live browser smoke tests instead).
- R2/Cloudflare bucket + API token creation is an external action only the user can do.
- Resend (or equivalent email provider) account + API key is an external action only the user can do.

## Verification

Standard pattern used and expected going forward: `npm run typecheck && npm run lint && npm test && npm run build` locally → push to `main` → poll `/api/health` + `/api/ai/health` until the new deploy is live → one real smoke test (register a `*.bayticare.test` throwaway account, exercise the changed flow) via the browser tool. See `.claude/skills/verify-project` and `.claude/skills/deploy-project`.

## Important paths

`prisma/schema.prisma` (data model) · `lib/ai/provider.ts` (AI provider) · `lib/health.ts` (score algorithm) · `lib/storage.ts` (file storage) · `.github/workflows/ci.yml` (CI) · `app/globals.css` (design tokens/styles).
