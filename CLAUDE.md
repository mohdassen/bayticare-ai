# BaytiCare AI

Saudi-first, Arabic-native (RTL) home management SaaS. Full context: [README.md](README.md), [DEPLOYMENT.md](DEPLOYMENT.md), [SECURITY.md](SECURITY.md), [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md).

## Stack

Next.js 15 (App Router) + TypeScript + Prisma 6 on **PostgreSQL** (Neon in prod) + Vercel. No separate backend — Server Actions and Route Handlers do everything. Gemini is the primary AI provider (`gemini-3.5-flash-lite`), OpenAI is the fallback, mock mode when neither key is configured.

## Directories

- `app/<page>/page.tsx` — Server Components, fetch data directly via `prisma`.
- `app/<page>/actions.ts` — `'use server'` Server Actions for that page's forms.
- `app/api/**/route.ts` — Route Handlers, used where a native `<form method="post">` posts directly (assets, rooms, properties) or where a client fetches JSON (auth, AI scans).
- `components/` — shared UI; `AssetWizard`, `DocumentUploadForm` are client components with local state.
- `lib/auth.ts` — session issue/verify (JWT in httpOnly cookie).
- `lib/ai/provider.ts` — Gemini/OpenAI/mock selection + structured-output schemas.
- `lib/storage.ts` — file storage abstraction (S3/R2 adapter + local-disk dev fallback).
- `lib/zatca.ts` — decodes the Saudi ZATCA e-invoice QR code from a photo.
- `lib/health.ts` — deterministic (non-AI) Home Health Score.
- `lib/rateLimit.ts` — in-memory, per-instance rate limiter.
- `prisma/schema.prisma` — source of truth for the data model.

## Commands

```bash
npm run typecheck   # prisma generate && tsc --noEmit
npm run lint        # next lint (eslint.config.mjs, flat config)
npm test            # vitest run
npm run build       # prisma generate && next build
npm run db:generate # prisma generate
npm run db:push     # prisma db push — see "Database" below before running against prod
npm run db:seed     # tsx prisma/seed.ts
```

Definition of done for any change here: all four of typecheck/lint/test/build pass, **and** a live check — hit the relevant page/API route or `/api/health` + `/api/ai/health` — not just "the code looks right."

## Deployment

Vercel deploys automatically from `main`. After pushing: poll `GET /api/health` (`{ok:true, database:"connected"}`) and `GET /api/ai/health` (`{ok:true, aiEnabled:true, provider:"gemini"}`) until the new deploy is live, then do one real smoke test of whatever changed (register/login still gate everything — a throwaway `*.bayticare.test` account is fine for this, see "Known traps"). Full env var list and R2 setup: [DEPLOYMENT.md](DEPLOYMENT.md).

## CI

`.github/workflows/ci.yml` on push/PR to `main`: `npm ci` → `prisma generate` → `typecheck` → `lint` → `test` → `build`. Uses a throwaway Postgres URL, never touches Neon. Does not deploy — Vercel's own build does that separately from `main`.

## Coding conventions

- **Ownership checks on every write.** Every create/update/delete re-derives ownership via `prisma.property.findFirst({where:{id, ownerId: user.id}})` (or through the property relation) before touching a client-supplied ID. Never trust a client ID alone — see the IDOR notes in `SECURITY.md`.
- **Arabic-first, no raw error text ever reaches the user.** Native `<form method="post">` routes (`/api/assets`, `/api/rooms`, `/api/properties`) must **never** `return new Response('some text', {status})` — the browser renders that as the literal page body on a full-page form post. Always `redirect(`/page?error=${encodeURIComponent(arabicMessage)}`)` instead, and the target page must read `searchParams.error` and show it in a `.badge.danger` banner. Fetch-based JSON routes (`/api/auth/*`, `/api/ai/*`) return `NextResponse.json({error: arabicMessage}, {status})`.
- **Gemini structured output must use `{ type: 'string', nullable: true }`** (OpenAPI style), never `{ type: ['string','null'] }` (JSON-Schema style, which OpenAI uses and Gemini's `responseSchema` rejects). See `lib/ai/provider.ts`.
- **AI never blocks manual entry.** Every scan endpoint returns a normal object on failure/mock mode (never throws to the client); every form with an AI-scan step has full manual fields always available.
- **Prisma enums, not `any`.** Cast form strings to the real Prisma enum type (`PropertyType`, `DocumentCategory`, etc.), validate against `new Set(Object.values(Enum))` first.
- Inline styles / template-literal `<style>` blocks are the existing convention for component-scoped CSS (see `AssetWizard.tsx`) — match it rather than introducing a new styling system. Shared/global classes live in `app/globals.css`.

## Database

**No migration history yet** — schema changes are applied with `prisma db push` (sync, not versioned migrations). Treat any `db push` against the production Neon database as a manual, reviewed, one-at-a-time action — never run it unattended, never with `--accept-data-loss` unless a removal is explicitly intended. Preferred long-term fix: switch to `prisma migrate`. See `DEPLOYMENT.md` → Database.

## Known traps (don't rediscover these)

- The browser preview tool can show **stale Next.js router-cached content** in a long-lived tab after a redeploy — if something looks unexpectedly old, verify against raw server HTML via `curl` (with a real session cookie) or a fresh tab before concluding there's a bug.
- Registering/logging in a throwaway test account for smoke tests leaves it in the production DB (`*.bayticare.test` emails) — there's no self-serve account deletion yet. Expected and fine for verification; just don't forget you did it.
- `lib/storage.ts` silently falls back to ephemeral local disk if `STORAGE_*` env vars aren't set in Vercel — uploaded files vanish on next redeploy until R2 credentials are actually configured there (external action, not something fixable in code).
- Don't name a React state setter `setInterval`/`setTimeout` etc. — shadows the global and is a real bug that shipped once (`AssetWizard.tsx`, now `setIntervalDays`).
- `next lint` needs `eslint.config.mjs` to exist or it launches an interactive setup prompt that hangs non-interactively — it's already configured, don't remove it.
