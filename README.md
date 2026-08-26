# BaytiCare AI
Saudi-first intelligent home operating system.

## MVP implemented
- Secure email/password authentication
- Arabic-first responsive interface
- Property digital twin foundation
- Asset registry
- Automatic preventive maintenance scheduling
- Explainable Home Health Score engine
- Tenant-scoped database queries
- Provider/booking schema foundation
- Documents/expenses/AI modules scaffolded

## Run locally
```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```
Demo: `demo@bayticare.sa` / `Demo1234!`

## Quality checks
```bash
npm run typecheck
npm test
npm run build
```

## Architecture
Next.js + TypeScript + Prisma. SQLite is used for zero-cost local MVP development; switch Prisma datasource to PostgreSQL for production.

## Next build phases
1. Document Vault + signed object storage
2. AI asset/invoice extraction provider adapter
3. Provider marketplace + booking state history
4. Subscriptions/payment abstraction
5. WhatsApp notification adapter
6. Home Passport PDF + QR asset tags
