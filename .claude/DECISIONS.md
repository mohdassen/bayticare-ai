# Architectural Decisions

Only decisions expensive/risky to rediscover. Not a changelog — see `git log` for that.

---
Decision: Gemini structured output uses OpenAPI-style `nullable: true`, OpenAI keeps JSON-Schema `type: ['x','null']` — two separate schema objects per call in `lib/ai/provider.ts`, not one shared schema.
Reason: Gemini's `responseSchema` rejects JSON-Schema union-type nullables; this silently broke asset/document scanning before it was split.
Impact: Never "simplify" these two schemas into one shared object.

---
Decision: Rate limiting (`lib/rateLimit.ts`) is in-memory, per-serverless-instance, not a shared store.
Reason: No Redis/Upstash budget approved yet; in-memory is a real (if imperfect) speed bump against a single hot instance, zero cost, zero new infra.
Impact: Not a hard distributed guarantee — a determined attacker spread across instances isn't fully blocked. Upgrade path documented in SECURITY.md if this becomes a real problem.

---
Decision: ZATCA QR data (`lib/zatca.ts`) overrides AI-vision-extracted fields when both are present, never the other way around.
Reason: QR payload comes from the invoice issuer's own signed e-invoice record — authoritative, not a model guess.
Impact: If `verifiedByZatca` is true in a scan response, don't second-guess merchant/total/VAT/date against the AI fields — they were intentionally overwritten.

---
Decision: `lib/storage.ts` auto-selects S3/R2 vs. local disk based on whether `STORAGE_*` env vars are set, rather than requiring a code change to switch.
Reason: Lets production activate real persistent storage by setting Vercel env vars alone, no redeploy-with-code-change needed.
Impact: If documents seem to vanish in prod, check whether `STORAGE_*` vars are actually set before assuming a code bug.

---
Decision: Deferred forcing the `npm audit` fixes (PostCSS source-map handling via Next's build pipeline; `deepmerge-ts` via Prisma's config loader) rather than accepting the major-version bumps (Next 16, older Prisma) `npm audit fix --force` wants to apply.
Reason: Neither advisory is reachable via user-supplied input in this app (no user-authored CSS or Prisma config processed at runtime); a forced major bump right before shipping was judged higher-risk than the (currently unreachable) advisories.
Impact: Re-evaluate when a Next 16 upgrade is otherwise on the roadmap for other reasons — don't force it just to silence `npm audit`.

---
Decision: No production database migration tooling switch (still `prisma db push`, not `prisma migrate`) despite the risk noted in DEPLOYMENT.md/SECURITY.md.
Reason: Switching requires baselining the existing production schema as the first migration — a one-time action that should be deliberately reviewed with real DB access, not done opportunistically mid-feature-work.
Impact: Any future schema change (e.g. adding `plan` to `User` for subscription entitlements) still needs a manual, reviewed `db push` until this switch happens.

---
Decision: Added `Referral` and `ProviderReview` models (schema.prisma) without a coordinated `db push` — this session has no production DATABASE_URL access. Every code path that touches either new table is wrapped in try/catch (`referrals` page, register route's referral log, `submitReview` action, services page's reviewed-status lookup) and degrades to "feature not active yet" rather than crashing.
Reason: Ship the referral-program and provider-rating UI now without risking a production outage from querying tables that don't exist in the real DB yet.
Impact: Referral tracking and provider ratings are inert (silently no-op / show "قيد الإعداد") until someone runs `npx prisma db push` against production. Once that runs, both features activate with no further code changes. Do not remove the defensive try/catch wrappers even after the push — they're also the correct posture for any future schema drift.

---
Decision: Monthly Home Health Report (`/api/cron/monthly-report`, `vercel.json` cron) requires `CRON_SECRET` to be set or the endpoint refuses to run (503), and email sending itself is a no-op (console log only) until `RESEND_API_KEY` is set (`lib/email.ts`).
Reason: Same "ship the architecture, activate on credential" pattern as storage/S3 — no email provider account exists yet, and an unauthenticated cron endpoint that emails every user is not something to leave open even briefly.
Impact: The `/reports` in-app page and "send now" button work immediately (reflect live data), but nobody actually receives an email — including from the monthly cron — until both env vars are set in Vercel.
