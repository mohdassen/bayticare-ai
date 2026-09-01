# Deployment

BaytiCare AI deploys from the `main` branch of `mohdassen/bayticare-ai` to Vercel. Production URL: https://bayticare-ai.vercel.app

## Prerequisites

- A PostgreSQL database. Production uses [Neon](https://neon.tech).
- A Vercel project linked to the GitHub repository, deploying from `main`.
- A Gemini API key (primary AI provider) and, optionally, an OpenAI API key as fallback.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string, `sslmode=require`. Use the **pooled** connection string for serverless functions. |
| `AUTH_SECRET` | Yes | Long random string. Signs session JWTs — rotating it invalidates all sessions. |
| `AI_PROVIDER` | Recommended | `gemini` (default/primary). Set to `openai` to force the fallback provider. |
| `GEMINI_API_KEY` | Yes (for AI features) | Google AI Studio key. |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.5-flash-lite`. |
| `OPENAI_API_KEY` | No | Fallback provider; only used if `AI_PROVIDER=openai` or Gemini is unconfigured. |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6`. |
| `NEXT_PUBLIC_APP_NAME` | No | Display name only, not secret. |

Never commit real values for `DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, or `OPENAI_API_KEY` — `.env` is gitignored; only `.env.example` (with placeholder values) is tracked.

## Database

Schema lives in `prisma/schema.prisma`, provider `postgresql`. This project has **no committed migration history yet** — it uses `prisma db push` (schema sync, not migration files). For a production database with real user data, prefer converting to `prisma migrate` so schema changes are reviewed, versioned, and reversible:

```bash
npx prisma migrate dev --name <change-description>   # generates a migration locally
npx prisma migrate deploy                              # applies pending migrations in CI/CD or manually
```

Until that switch happens, treat any `prisma db push` against production as a manual, reviewed action — never run it unattended, and never with `--accept-data-loss` unless a column/table removal is explicitly intended and backed up.

## Deploy flow

1. Push to `main` (directly or via a merged PR). Vercel builds automatically.
2. Vercel runs `npm run build`, which itself runs `prisma generate && next build` — this requires `DATABASE_URL` to be set at build time for the Prisma client to generate correctly (no live DB connection is needed at build time, just the schema).
3. After the deploy completes, verify:
   - `GET /api/health` → `{ "ok": true, "database": "connected" }`
   - `GET /api/ai/health` → `{ "ok": true, "aiEnabled": true, "provider": "gemini", "keyConfigured": true }`
   - Log in (or register a throwaway account) and confirm the dashboard, asset wizard, and maintenance flows work end-to-end.
4. If a deploy fails, check the Vercel build logs first (compile/type errors), then the function logs (runtime errors — DB connection, missing env vars).

## Rollback

Vercel keeps every deployment addressable. If `main` ships a regression, redeploy the last known-good deployment from the Vercel dashboard (Deployments → select the prior one → Promote to Production) rather than force-reverting git history — this avoids destructive git operations for what is fundamentally a "restore a known-good build" action.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: `npm ci`, `prisma generate`, `typecheck`, `lint`, `test`, `build`. It does **not** run any database migration — CI has its own throwaway Postgres connection string and never touches Neon. Vercel's own build is what ships to production; CI is a pre-merge quality gate.
