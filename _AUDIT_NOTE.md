# Audit Apply Notes — AIhomecompanion

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 21.

## Original Recommendations (AI Counterparts)
- `/expense-optimizer`
- `/occupancy-prediction`
- `/guest-profiling`
- `/emergency-response-advisor`
- `/routine-learning`

## Implemented (this pass)
Three endpoints appended to `backend/routes/ai.js`. A small `callAI` helper was extracted from the existing inline OpenRouter calls to avoid duplication.

- `POST /api/ai/expense-optimizer` — pulls budget, energy logs, and devices; recommends cost-saving automations and unused-service cancellations with savings ranges.
- `POST /api/ai/occupancy-prediction` — pulls rooms, sensor snapshot, and schedules; predicts per-room occupancy probability over a configurable lookahead (default 24h) and recommends HVAC/lighting/standby actions.
- `POST /api/ai/routine-learning` — pulls automations, schedules, sensors, and recent assistant conversations; detects recurring family patterns and proposes new automations with confidence scores.

Syntax: `node --check` passes.

## Backlog
- `/guest-profiling` — needs guest preference schema/relations.
- `/emergency-response-advisor` — needs emergency action playbook + device-control safety review (TOO-RISKY mechanically).
- Custom: agentic household orchestrator (needs autonomy guardrails), real-time energy demand shifting (needs utility tariff integration), proactive maintenance prediction (could be quick mechanical follow-up using `predictive` and `maintenance` tables), multi-home arbitrage, multimodal voice+video.

## Categorization
- MECHANICAL: 3 endpoints (done).
- TOO-RISKY mechanically: emergency-response-advisor (issues device-control instructions during emergencies).
- NEEDS-PRODUCT-DECISION: guest-profiling schema, autonomy boundary for orchestrator.
- NEEDS-CREDS: utility tariff API for demand-shifting.

## Apply pass 3 (frontend)

Status: **LEFT-AS-IS**. Frontend already wires the three pass-2 endpoints.

- `frontend/src/pages/AdvancedAITools.jsx` declares a `TOOLS` table for `expense-optimizer`, `occupancy-prediction`, and `routine-learning`, and POSTs to `${API}/ai/${tool.key}` with `Authorization: Bearer ${token}` (token pulled from `AppContext` → `localStorage.getItem('token')`).
- Routed in `frontend/src/App.jsx` at `/advanced-ai`; sidebar links via `setCurrentPage`.
- Pre-existing `pages/AIAssistant.jsx` (`/ai`) covers earlier `/chat`-style endpoints.
- Backend 503-no-key error body propagates to UI through the page's error state.

No FE files written this pass. No `npm install`. No new deps. See `_AUDIT/apply3_logs/ab3_64.md`.

