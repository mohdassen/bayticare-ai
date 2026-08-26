# BaytiCare AI
Saudi-first intelligent home operating system.

## Implemented now
- Secure email/password authentication
- Arabic-first responsive interface
- Property digital twin foundation
- Asset registry
- Automatic preventive maintenance scheduling
- Explainable Home Health Score engine
- Tenant-scoped database queries
- Functional Document Vault with server-side ownership checks
- File validation and secure storage abstraction
- AI provider abstraction with safe fallback mode
- AI issue-triage UI with emergency keyword safety handling
- Service marketplace foundation
- Verified provider catalogue
- End-to-end customer booking creation/cancellation
- Immutable booking status history
- Home maintenance expense dashboard
- Seeded Saudi demo experience
- GitHub Actions quality workflow

## Run locally
```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Demo account:
`demo@bayticare.sa` / `Demo1234!`

## Quality checks
```bash
npm run typecheck
npm test
npm run build
```

## Architecture
Next.js + TypeScript + Prisma using a modular-monolith approach. SQLite is retained for zero-cost MVP development. Production deployment should move the Prisma datasource to PostgreSQL and replace local file storage with an S3-compatible private object-storage adapter.

## Security principles
- User-owned property scope is validated server-side.
- Documents and bookings cannot be created against another user's property/assets.
- Raw secrets are never committed.
- Uploaded files are type/size validated and are not exposed as public URLs by the storage layer.
- Dangerous home-issue keywords trigger a safety-first response rather than speculative diagnosis.

## Current build roadmap
1. Real AI asset/image recognition and invoice/warranty extraction
2. Provider owner portal + technician workflow
3. Booking state transitions and customer completion confirmation
4. Ratings and provider quality metrics
5. Subscription plans and payment abstraction
6. Notifications + WhatsApp adapter
7. Home Passport PDF
8. QR asset tags
9. Admin portal and provider verification workflow
10. PostgreSQL production migration and deployment hardening
