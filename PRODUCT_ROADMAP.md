# Product Roadmap

Status snapshot as of this audit. "Done" means shipped and verified in production; "Partial" means a working MVP exists but is missing pieces called out in the vision; "Not started" means schema/scaffolding may exist but no working feature.

## Done

- Authentication, sessions, Arabic/RTL UI
- Property → Room → Asset digital twin with ownership-scoped queries
- Guided asset onboarding wizard (photo scan optional, manual entry always available, property/room persist across steps)
- Automatic maintenance scheduling on asset creation + on maintenance completion (recalculates `nextMaintenanceAt`, creates the next event)
- Gemini as primary AI provider with OpenAI fallback and transparent mock mode; Gemini-compatible nullable JSON schemas; asset photo scan; document (invoice/warranty) scan
- Deterministic, explainable Home Health Score
- Document Vault (upload, categorize, link to asset, AI-assisted field extraction), with property/asset/category filters
- S3/R2-compatible storage adapter (`lib/storage.ts`) — activates automatically once `STORAGE_*` env vars are set in Vercel; falls back to ephemeral local disk otherwise (see DEPLOYMENT.md)
- ZATCA e-invoice QR verification (`lib/zatca.ts`) — reads the standard Saudi invoice QR code as an authoritative source for merchant/total/VAT/date, layered under the AI vision scan
- Rate limiting on login, registration, and both AI scan endpoints (`lib/rateLimit.ts` — in-memory, per-instance; see SECURITY.md for the distributed-store caveat)
- Privacy Policy and Terms of Use pages (`/privacy`, `/terms`), linked from registration, the landing page, and the app sidebar
- Service booking MVP: request a service, verified provider catalogue, cancel, immutable status history
- Maintenance center (open/overdue/upcoming/completed, cost entry, lifetime + monthly expense analytics), tracked ownership cost (purchase price + lifetime maintenance) per asset
- Dashboard: health score with actionable per-asset reasons+CTAs, KPIs, upcoming/overdue list, quick actions
- CI: typecheck, lint, test, build on every push/PR

## Now (recommended next 2-3 iterations)

1. **Configure real R2/S3 credentials in Vercel.** The storage adapter is built and ready (see DEPLOYMENT.md) but still runs on the ephemeral local-disk fallback until `STORAGE_ENDPOINT`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY` are actually set — this is an external action (create the R2 bucket + API token) that needs a human with Cloudflare/Vercel dashboard access.
2. **Family access enforcement.** `PropertyMember`/`Role.FAMILY_MEMBER` exist in the schema but no ownership check consults them yet — every check is `ownerId === user.id`. Extend the ownership checks in `assets`, `rooms`, `documents/actions.ts`, and `services/actions.ts` to also accept a matching `PropertyMember`, then build the invite UI.
3. **Multi-property dashboard.** The dashboard currently shows only the first property (`findFirst`) — fine for the Free tier's 1-property limit, but needs a property switcher before Plus/Premium (multi-property) tiers can be sold.

## Next

4. **Subscription entitlements in code** (no payments yet, per the original brief): add a `plan` field to `User`, a `PLAN_LIMITS` table (`maxProperties`, `maxAssets`, `monthlyAIScans`, `familyMembers`), and enforce it at the point of creation (property/asset/AI-scan routes) with a friendly Arabic upgrade prompt on limit. This needs a reviewed Prisma migration against the production database — do not run schema changes against Neon production without a deliberate, reviewed migration step.
5. **Notifications.** Warranty-expiring and maintenance-due reminders currently exist only as in-app dashboard copy — no email/SMS/WhatsApp delivery yet.
6. **Provider-owner portal & technician workflow.** `Booking`/`BookingStatusHistory` support the full status machine (`REQUESTED` → ... → `COMPLETED`/`DISPUTED`) in the schema, but there is no UI for a provider to actually transition a booking through those states — customers can only create/cancel today.
7. **Real issue-diagnosis AI.** `app/ai/actions.ts` → `diagnoseIssue` currently returns a canned Arabic safety message rather than calling the configured AI provider for a real triage response (both `GeminiProvider.diagnoseIssue` and `OpenAIProvider.diagnoseIssue` are stubs). Decide whether to wire this to a real model call (with the same "never invent, always disclose confidence" discipline used for asset/document scanning) or keep it a deliberately conservative safety-first stub — currently ambiguous which was intended.

## Later

8. Admin/provider verification portal, ratings & quality metrics for providers
9. Home Passport PDF export, QR asset tags
10. Payment integration (only after the entitlement logic above is stable and tested)
11. Structured application logging/observability beyond `console.*` (e.g. request IDs, correlation with Vercel's log drains) for auth/DB/AI failures
