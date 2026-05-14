# Apply Pass 5 — AIhomecompanion

**Date:** 2026-05-08
**Stack:** Node-Express + React (Vite). Postgres. JWT bearer (`auth` middleware). `callAI(systemPrompt, userPrompt, maxTokens)` helper in `routes/ai.js`. Persistence to `ai_conversations` (some endpoints).
**Source audit:** `/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 21.

## Verified present
- Pass 2: `/expense-optimizer`, `/occupancy-prediction`, `/routine-learning`.
- Pass 4: `/proactive-maintenance`.
- Existing: `/chat`, `/analyze-energy`, `/analyze-security`, `/suggest-automation`, `/health-report`.
- 503-on-no-key guard in pass 4 endpoint; pass 5 endpoints use the same explicit guard.
- FE `AdvancedAITools.jsx` exposes the pass 2 + 4 tools.

## Implemented this pass (3 items: 2 AI advisory + 1 non-AI feature)
1. `POST /api/ai/guest-profiling` — advisory profile from existing `guests` and (optional) `guest_visits` tables. Tagged ADVISORY; respects privacy.
2. `POST /api/ai/emergency-response-advisor` — ADVISORY playbook ONLY. Always recommends calling 911 first. Does NOT execute device controls. Audit had flagged this as TOO-RISKY mechanically; pass 5 reframes it as advisory-only with explicit disclaimer in both system prompt and response payload.
3. `/api/family-permissions` (CRUD: GET, POST, PUT/:id, DELETE/:id, GET /scopes/allowed) — non-AI additive feature for family member sharing & scoped permissions. Auto-creates `family_permissions` table on first request via `CREATE TABLE IF NOT EXISTS`. Allow-list of valid scopes prevents arbitrary scope strings. Solves "No family member sharing/permissions" audit gap.

All three:
- `auth` middleware.
- 503-on-no-key for AI endpoints.
- Additive only — no existing schema modified.

### FE
- `frontend/src/pages/AdvancedAITools.jsx` extended with two new tool entries (`guest-profiling`, `emergency-response-advisor`).
- New page `frontend/src/pages/FamilyPermissions.jsx` with full CRUD UI, scope checkboxes (introspected from `/scopes/allowed`).
- Routed at `/family-permissions` in `App.jsx`.

## Deferred / categorization
- TOO-RISKY: real autonomous device control during emergencies.
- NEEDS-CREDS: utility tariff API (real-time energy demand shifting), device marketplace integrations, vendor service booking APIs.
- NEEDS-PRODUCT-DECISION: multi-home arbitrage, multimodal voice+video orchestration, agentic household autonomy boundary.

## Smoke test
- `node --check` PASS for all modified/new server files.
- New table uses `CREATE TABLE IF NOT EXISTS` and won't disturb existing data.

## Cap respected
3 of 5 allowed (2 AI + 1 non-AI). Remaining custom features need creds or significant product decisions.
