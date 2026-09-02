---
name: deploy-project
description: Use immediately after pushing a BaytiCare AI change to main that's meant to ship. Confirms the Vercel deploy is live and does a real smoke test — not just that the push succeeded.
---

1. `git push origin main` (only after `verify-project` passes locally).
2. Poll until the new deploy is live — Vercel doesn't expose a status API without a token from this session, so poll the health endpoints on a short interval instead of a fixed sleep:
   ```bash
   i=0; until [ $i -ge 8 ]; do code=$(curl -s -o /dev/null -w "%{http_code}" https://bayticare-ai.vercel.app/api/health); echo $code; [ "$code" = "200" ] && break; sleep 15; i=$((i+1)); done
   ```
3. Also check `GET /api/ai/health` → expect `{"ok":true,"aiEnabled":true,"provider":"gemini"}`.
4. A 200 on `/api/health` only proves *some* deployment is up, not that *your* new one is — if the change touched a specific page/route, verify the actual new content:
   - `curl` a distinctive string from the change (new CSS class, new copy) out of the served HTML/CSS bundle, or
   - use the browser tool with a **fresh tab** (a long-lived reused tab can serve stale Next.js router-cached content — see CLAUDE.md "Known traps") and do a real smoke test: register a throwaway `*.bayticare.test` account via the register form or `POST /api/auth/register`, then exercise the changed flow.
5. If the build failed or the smoke test fails, that's a new bug — root-cause and fix it, redeploy, re-verify. Don't report "pushed" as if it were "deployed and working."
