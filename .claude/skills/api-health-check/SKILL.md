---
name: api-health-check
description: Use for a quick check of whether BaytiCare AI production is up and correctly configured — database connectivity and AI provider readiness — without needing Vercel dashboard access.
---

```bash
curl -s https://bayticare-ai.vercel.app/api/health
# expect: {"ok":true,"database":"connected","environment":"production",...}

curl -s https://bayticare-ai.vercel.app/api/ai/health
# expect: {"ok":true,"aiEnabled":true,"provider":"gemini","keyConfigured":true,...}
```

Both endpoints are safe to poll (no auth needed, no secrets in the response). A 503/`ok:false` on `/api/health` means the DB connection is down — check `DATABASE_URL` in Vercel env vars first, this is the most common cause. `aiEnabled:false` or `provider:"mock"` on `/api/ai/health` means `GEMINI_API_KEY` isn't set or is shorter than the 20-char sanity check in `lib/ai/provider.ts`.

Neither endpoint proves a *specific* recent change is live — for that, see the project's `deploy-project` skill.
