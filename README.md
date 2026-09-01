# BaytiCare AI

Saudi-first, Arabic-native intelligent home operating system. Next.js (App Router) + TypeScript + Prisma on PostgreSQL, deployed on Vercel.

BaytiCare turns a household into a "Digital Home Twin": Property → Rooms → Assets/Appliances → Warranties → Maintenance → Documents → Service Bookings → Expenses, with an explainable Home Health Score tying it together.

## Implemented today

- Email/password authentication with signed, httpOnly session cookies (`jose` JWT)
- Arabic-first, RTL-first UI (`<html lang="ar" dir="rtl">`)
- Property → Room → Asset digital twin with server-side ownership checks on every write
- Guided 3-step asset onboarding wizard (location → optional AI photo scan → review & save) that persists the selected property/room across steps
- Automatic preventive maintenance scheduling: creating an asset creates its first `MaintenanceEvent`; completing one recalculates `nextMaintenanceAt` and schedules the next event
- AI provider abstraction: **Gemini is the primary provider**, with an OpenAI fallback and a transparent mock mode when no key is configured — never fabricates data, always reports real confidence
- AI asset photo scanner (category/manufacturer/model/serial) and AI invoice/warranty document scanner (merchant/invoice/date/price/VAT/warranty)
- **ZATCA e-invoice QR verification** (`lib/zatca.ts`): decodes the standard Saudi invoice QR code as an authoritative, non-hallucinated source for merchant/total/VAT/date before falling back to AI vision
- Document Vault with per-file type/size validation, property/asset/category filters, and an S3/R2-compatible storage adapter (`lib/storage.ts`) — activates automatically once storage credentials are set, otherwise falls back to local disk for dev
- Deterministic, explainable Home Health Score (`lib/health.ts`) — not AI-generated, so it's auditable, with actionable per-asset reasons and CTAs on the dashboard
- Service marketplace MVP: verified provider catalogue, booking creation/cancellation, immutable booking status history
- Home maintenance expense dashboard (monthly/yearly/by-category/by-asset, tracked ownership cost per asset)
- Rate limiting on auth and AI-scan endpoints (`lib/rateLimit.ts`)
- Privacy Policy and Terms of Use pages (`/privacy`, `/terms`)
- `/api/health` (database) and `/api/ai/health` (AI provider readiness) — safe to poll, never leak secrets
- GitHub Actions CI: typecheck, lint, test, build on every push/PR

## Not yet implemented (see [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md))

Family member access/roles, provider-owner portal & technician workflow, subscription plan enforcement, notifications (email/WhatsApp), multi-property dashboard aggregation. S3/R2 storage code exists but needs real credentials configured in Vercel to activate (see DEPLOYMENT.md).

## Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, GEMINI_API_KEY
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Demo account (local dev only — see `prisma/seed.ts`): `demo@bayticare.sa` / `Demo1234!`

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four run in CI (`.github/workflows/ci.yml`) on every push and pull request to `main`.

## Architecture

Next.js App Router + TypeScript, Prisma ORM on **PostgreSQL** (Neon in production), modular monolith — no separate backend service. Server Actions and Route Handlers enforce per-user ownership on every read/write (`property.ownerId`, `asset.propertyId`, etc.) to prevent cross-tenant (IDOR) access.

Key modules:
- `lib/auth.ts` — session issuance/verification (JWT in an httpOnly, `secure`-in-production cookie)
- `lib/ai/provider.ts` — Gemini/OpenAI/mock provider selection and structured-output schemas (Gemini uses OpenAPI-style `nullable: true`, not JSON Schema `type: ['string','null']`, which Gemini's `responseSchema` rejects)
- `lib/storage.ts` — file storage abstraction (swap `getStorageProvider()` for an S3/R2 adapter in production)
- `lib/health.ts` — deterministic Home Health Score calculation

## Environment variables

See [.env.example](./.env.example) for the full list, and [DEPLOYMENT.md](./DEPLOYMENT.md) for how to configure them in Vercel.

## Security

See [SECURITY.md](./SECURITY.md).

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).
