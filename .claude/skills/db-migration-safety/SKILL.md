---
name: db-migration-safety
description: Use before any Prisma schema change is applied to BaytiCare AI's production database, or when asked to add/modify a model/field. This project has no migration history yet — `db push` is a direct, unreviewed sync against production Neon.
---

1. Edit `prisma/schema.prisma`, run `npm run typecheck` (runs `prisma generate`) to confirm the schema itself is valid and the generated client compiles against current code.
2. **Never run `npx prisma db push` against the production `DATABASE_URL` from an automated/unattended flow.** This session typically has no production `DATABASE_URL` at all (see `.claude/PROJECT_STATE.md` → Blockers) — if it ever does, treat `db push` as a manual, one-at-a-time, explicitly-confirmed action, never batched with other changes.
3. Never pass `--accept-data-loss` unless a column/table removal is explicitly intended and the user has confirmed it.
4. Prefer additive changes (new optional field, new table) over destructive ones (dropping/renaming a column) — additive changes are safe to `db push` without data loss; destructive ones need a reviewed, backed-up path.
5. Record the decision in `.claude/DECISIONS.md` if the schema change has non-obvious impact (e.g. a new enum value that old rows won't have).
6. Longer-term: this project should switch to `prisma migrate` for versioned, reversible migrations — don't do that switch opportunistically mid-feature, it needs its own reviewed pass with real DB access (see `.claude/DECISIONS.md`).
