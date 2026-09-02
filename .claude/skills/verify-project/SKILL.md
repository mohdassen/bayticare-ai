---
name: verify-project
description: Use before declaring any BaytiCare AI change complete. Runs the real project verification chain and a live smoke test — this project's definition of done requires both.
---

1. `npm run typecheck` — `prisma generate && tsc --noEmit`.
2. `npm run lint` — `next lint`; needs `eslint.config.mjs` present or it hangs on an interactive prompt.
3. `npm test` — `vitest run`.
4. `npm run build` — `prisma generate && next build`; does **not** need a live `DATABASE_URL` connection, only a valid schema.

Stop and fix at the first failure (see the global `fix-until-green` skill) rather than running all four and triaging together.

5. For anything touching a live route/page: use `deploy-project` after pushing, or for local-only verification, note that local dev needs a real `DATABASE_URL` in `.env` which this environment does not have by default — most auth/DB-backed pages can only be truly verified after deploy.

Never report a task done from steps 1-4 alone if the change touches user-facing behavior — see `deploy-project`.
