# Smart Lab Online v1.5 — AI Expansion Plan

Goal: evolve SML from "AI-assisted" to "AI-first" by introducing seven new intelligence features on top of a shared, scalable AI architecture. No feature work ships until the shared layer (Phase 1) is in place — that's what keeps the seven features modular instead of seven one-off integrations.

## 1. Architecture Overview

A single AI gateway layer sits between the app and Lovable AI. Every feature is a thin "AI module" that declares: input contract → prompt/tool spec → output schema → persistence target.

```text
 ┌──────────────────────────────────────────────────────────┐
 │ UI (student / parent / teacher / admin)                  │
 └──────────────┬───────────────────────────────────────────┘
                │ useServerFn (typed RPC)
 ┌──────────────▼───────────────────────────────────────────┐
 │ AI Modules (src/lib/ai/<module>.functions.ts)            │
 │  adaptive · tests · planner · voice · revision ·         │
 │  predict · parent-insights                               │
 └──────────────┬───────────────────────────────────────────┘
                │
 ┌──────────────▼───────────────────────────────────────────┐
 │ AI Core (src/lib/ai/core.server.ts)                      │
 │  • gateway client (Lovable AI, model routing)            │
 │  • structured-output (Zod schemas via AI SDK Output)     │
 │  • streaming helpers (async generators)                  │
 │  • prompt registry + versioning                          │
 │  • tool registry (RAG, db lookups, calc)                 │
 │  • cost/usage logging + rate-limit guard                 │
 │  • cache (idempotency key → response)                    │
 └──────────────┬───────────────────────────────────────────┘
                │
   ┌────────────┼─────────────────────────┐
   ▼            ▼                         ▼
 Lovable AI   Supabase (pgvector,     External (TTS/STT
 Gateway      ai_runs, ai_cache)      for Voice Tutor)
```

Key choices:
- **One gateway helper** (`createLovableAiGatewayProvider`) reused by every module — no per-feature provider code.
- **Model routing table** per use case (fast/cheap default = `google/gemini-3-flash-preview`; reasoning = `google/gemini-3.1-pro-preview`; voice = STT/TTS via external when needed).
- **Structured output everywhere** via AI SDK `Output.object` + Zod — no "parse JSON from prose."
- **All AI calls server-side** as `createServerFn` (or `/api/public/*` for webhooks). `LOVABLE_API_KEY` read inside `.handler()`.
- **Every run logged** to `ai_runs` (module, prompt_version, model, tokens, latency, cost, user_id) — powers observability + per-user quotas.
- **RAG layer** (pgvector) shared by revision, planner, tutor — chapter content embedded once, queried by many features.

## 2. Shared Data Layer (new tables)

- `ai_runs` — every call: module, model, prompt_version, input_hash, tokens_in/out, latency_ms, cost_cents, status, user_id.
- `ai_cache` — idempotency: (module, input_hash) → output JSON, ttl.
- `ai_prompts` — versioned prompt templates (id, module, version, template, created_by, active).
- `content_embeddings` — pgvector embeddings of chapters, lessons, past questions (source_type, source_id, embedding, chunk).
- `learner_state` — per-student rolling vector: mastery per topic, recent accuracy, time-on-task, weak tags. Updated by adaptive + predict modules.
- `ai_quotas` — per-user daily/monthly limits per module tier (free / pro).

RLS: students see their own runs/state; parents see linked-child summaries; admin sees all.

## 3. Feature Modules (built on the core)

Each module is a folder `src/lib/ai/<name>/` with `functions.ts` (RPCs), `prompts.ts` (versioned), `schema.ts` (Zod IO), and a UI route. Build order matches dependency order.

| # | Module | Depends on | Core primitive |
|---|---|---|---|
| 1 | **Adaptive Learning** | learner_state, ai_runs | structured output: next-best item + difficulty |
| 2 | **AI Test Generator** | embeddings, prompts | structured output: MCQ[] with answer+explanation |
| 3 | **Study Planner** | learner_state, calendar | structured output: weekly plan blocks |
| 4 | **AI Revision Engine** | embeddings (RAG), spaced-rep | retrieval + summarize + flashcards |
| 5 | **Predictive Performance** | ai_runs, attempt history | model-as-classifier → exam-score forecast + risk |
| 6 | **AI Parent Insights** | predict + learner_state | weekly digest, streaming summary |
| 7 | **Voice Tutor** | revision + tool calls | STT in → core chat (tools) → TTS out, streaming |

Voice Tutor reuses the chat streaming pattern (`async function*` server fn). STT/TTS provider chosen in Phase 3; until then it ships as text chat with mic input stub.

## 4. API Structure

Per-module RPC surface (all `createServerFn`, all auth-gated):

```text
src/lib/ai/
  core.server.ts            // gateway, schemas, logging, cache
  adaptive.functions.ts     // nextItem, recordOutcome
  tests.functions.ts        // generateTest, regenerateQuestion
  planner.functions.ts      // buildPlan, replan, completeBlock
  revision.functions.ts     // summarizeChapter, makeFlashcards, askDoubt (stream)
  voice.functions.ts        // startSession, sendUtterance (stream), endSession
  predict.functions.ts      // forecastExam, riskFlags
  parent-insights.functions.ts // weeklyDigest (stream), alertCheck
```

Public surface (external/cron) under `src/routes/api/public/`:
- `ai/cron/weekly-digest` — generates parent digests + queues emails.
- `ai/cron/embeddings-refresh` — re-embed new/updated content.

## 5. AI Workflow System

A lightweight workflow runner (no new dependency — composed from server fns) handles multi-step jobs:

```text
trigger → fetch context → (optional) RAG → AI call (structured) →
   validate (Zod) → persist → emit event → next step / done
```

- **Sync workflows** (test gen, next-item): run inside one server fn.
- **Async workflows** (weekly digest, embedding refresh, forecast batch): triggered by pg_cron → `/api/public/ai/cron/*` → enqueue rows in `ai_jobs` → worker fn drains.
- **Streaming workflows** (voice tutor, doubt solver, parent digest preview): `async function*` server fns yielding deltas.
- **Approval gates**: any tool that writes to a student's plan or sends a parent alert is wrapped with `needsApproval` so a teacher/admin can review in v1.5.1.

## 6. Modular Integration Plan (phased rollout)

**Phase 1 — Foundation (ship before any feature)**
- Build AI Core (gateway helper, structured output helpers, cache, logging, quotas).
- Migrations: `ai_runs`, `ai_cache`, `ai_prompts`, `ai_quotas`, `content_embeddings`, `learner_state` (+ RLS).
- Admin "AI Control Center" page: model routing table, prompt versions, per-module on/off toggles, live cost dashboard.

**Phase 2 — Learning loop (highest user value)**
- Adaptive Learning module (drives the existing test/practice UI).
- AI Test Generator (replaces the current MCQ generator with the shared pipeline).
- AI Revision Engine + RAG ingestion job for existing chapter content.

**Phase 3 — Planning & foresight**
- AI Study Planner (consumes learner_state + calendar).
- Predictive Performance (batch + on-demand forecasts; feeds student analytics).

**Phase 4 — Conversational & parent surface**
- Voice Tutor (text chat first, then STT/TTS integration).
- AI Parent Insights (weekly digest cron + on-demand summary in parent dashboard).

**Phase 5 — Hardening**
- Eval harness: golden prompts per module, regression checks before prompt-version promotion.
- Per-tier quotas wired to subscription plans.
- A/B prompt routing via `ai_prompts.active`.

## 7. Non-Functional Requirements

- **Cost control**: cache by input hash; cheap model by default, escalate via routing table; per-user daily quotas; cost dashboard with alerts.
- **Latency**: stream everything user-waits-on; precompute digests/forecasts via cron.
- **Safety**: structured output + Zod validation; no user PII in prompts beyond what the module needs; prompt-injection guard on free-text inputs.
- **Observability**: every run in `ai_runs`; admin dashboard shows tokens, cost, latency, error rate per module.
- **Reversibility**: feature flags per module so any one can be disabled without a deploy.

## 8. Out of Scope for v1.5

- On-device/offline inference.
- Fine-tuned custom models — stay on hosted Lovable AI.
- Real-time multi-student tutoring sessions (single-user voice only).
- Image-based question solving (deferred to v1.6).

---

This plan is the contract for the v1.5 cycle. Approve to proceed; first implementation PR will be Phase 1 (AI Core + migrations + Admin AI Control Center) with zero user-facing feature changes.
