# Smart Lab Online — Version 2.0 Architecture

> **Status:** Forward-looking design blueprint. Defines the technical foundation, AI pipeline, and roadmap to evolve SML from a learning platform into a **next-generation AI education operating system**.

---

## 1. Vision

Smart Lab Online v2.0 is built around one principle: **every learner deserves an AI that knows them.**

The platform shifts from *content delivery* to **continuous learning intelligence** — a system that observes, predicts, adapts, mentors, and emotionally supports every student in real time, while giving teachers and schools institution-grade analytics.

---

## 2. Architectural Pillars

| Pillar | What It Enables |
|---|---|
| **Future-Ready Core** | Modular boundaries so v3 features slot in without rewrites |
| **Modular AI Pipeline** | Each AI capability is a swappable, observable stage |
| **Scalable AI Orchestration** | Multi-model routing, queueing, caching, cost control |
| **Learning Intelligence Layer** | Unified student model powering every AI feature |
| **Privacy & Safety by Design** | Child-safe, RLS-enforced, auditable, region-aware |

---

## 3. High-Level System Map

```text
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (TanStack Start)                   │
│  Student · Teacher · Parent · School Admin · Voice Tutor Shell   │
└───────────────────────────┬──────────────────────────────────────┘
                            │  Server Functions / Server Routes
┌───────────────────────────▼──────────────────────────────────────┐
│                   APPLICATION SERVICE LAYER                      │
│  Auth · Curriculum · Quiz · School · Engagement · Voice · Mentor │
└───────────────────────────┬──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                 AI ORCHESTRATION LAYER (new)                     │
│  Router · Planner · Tool Registry · Memory · Guardrails · Cache  │
└──────┬──────────────┬──────────────┬──────────────┬──────────────┘
       │              │              │              │
   ┌───▼────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
   │ Text   │   │  Voice    │  │  Vision   │  │ Predictive│
   │ Models │   │ STT / TTS │  │   OCR     │  │   ML      │
   └────────┘   └───────────┘  └───────────┘  └───────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│            LEARNING INTELLIGENCE STORE (Supabase + Vector)       │
│  Student Graph · Mastery · Affect · Embeddings · Event Stream    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Modular AI Pipeline

Every AI feature follows the same 6-stage pipeline. Stages are swappable, observable, and independently scalable.

```text
Input → Context → Plan → Execute → Guardrail → Persist → Feedback
```

| Stage | Responsibility | v2.0 Module |
|---|---|---|
| **Input** | Normalize text/voice/image/event | `ai/io/*` |
| **Context** | Hydrate student graph, mastery, affect, history | `ai/context/student-context.server.ts` |
| **Plan** | Route to model, choose tools, set budget | `ai/orchestrator/router.server.ts` |
| **Execute** | Call model(s), stream, run tools | `ai/runners/*` |
| **Guardrail** | Safety, age-appropriateness, citation, PII | `ai/safety/*` |
| **Persist** | Write events, embeddings, mastery deltas | `ai/memory/*` |
| **Feedback** | Capture signals → improve next call | `ai/feedback/*` |

**Why this matters:** Voice tutor, mentor, exam prep, and adaptive testing all reuse the same pipeline — only the **runner** and **system prompt pack** differ.

---

## 5. AI Orchestration Layer

A single `ai/orchestrator` service owns *every* model call. No feature talks to Lovable AI directly.

**Responsibilities:**
- **Model Router** — pick model by task (fast → `gemini-3-flash-preview`, deep reasoning → `gpt-5.4`, voice → STT/TTS providers, image → `gemini-3.1-flash-image-preview`).
- **Budget & Quota** — per-student, per-school, per-feature caps; graceful degradation.
- **Cache** — semantic cache on (prompt + context hash) to cut repeat cost on common explanations.
- **Queue** — long-running jobs (curriculum generation, weekly insights) via background server functions.
- **Telemetry** — latency, tokens, cost, satisfaction, hallucination flags per call.
- **Fallback Chain** — if primary model is rate-limited (429) or out of credits (402), fall back transparently.

---

## 6. Learning Intelligence Store

The **unified student model** every AI feature reads from and writes to.

| Domain | Tables (v2 additions in **bold**) |
|---|---|
| Identity | `profiles`, `user_roles`, `school_members` |
| Curriculum | `subjects`, `chapters`, `concepts`, **`concept_graph_edges`** |
| Mastery | **`student_mastery`** (per concept, decaying), **`forgetting_curve_state`** |
| Behavior | `xp_events`, `student_engagement`, **`session_telemetry`** |
| Affect | **`affect_signals`** (frustration, confidence, focus, burnout) |
| Memory | **`student_embeddings`** (pgvector), **`ai_conversations`**, **`ai_messages`** |
| Predictions | **`learning_predictions`** (exam readiness, at-risk, next-best-action) |

`pgvector` powers semantic recall for mentor chats, exam prep, and personalized curriculum search.

---

## 7. Future Feature Specs

### 7.1 Voice AI Tutor
- **Stack:** WebRTC mic → STT (streaming) → orchestrator → LLM → TTS → audio out.
- **Provider:** ElevenLabs Conversational Agents (token minted server-side) or OpenAI Realtime, abstracted behind `ai/runners/voice.server.ts`.
- **Context:** Pulls student mastery + current chapter + last 5 mistakes into agent's system prompt at session start.
- **Output:** Transcripts persisted to `ai_messages`; mastery deltas inferred and written back.

### 7.2 AI-Generated Teaching
- Generates **multi-modal lessons** (script + slides + diagrams + practice) from a concept ID.
- Pipeline: `concept → outline → script → image-prompts → render → quiz` (each stage cacheable).
- Stored in `generated_lessons` and reused across students until concept definition changes.

### 7.3 Predictive Learning Intelligence
- Nightly batch job computes per-student:
  - Exam readiness score (0–100) per subject
  - At-risk flag (drop in mastery velocity, rising affect-frustration)
  - Next-best-action (revise X, attempt Y, rest)
- Surfaced in student dashboard, teacher analytics, and school insights.

### 7.4 Personalized AI Curriculum
- Curriculum is no longer static — it's a **generated learning path** over the concept graph.
- Inputs: target exam, deadline, current mastery, available study minutes/day, learning style.
- Output: weekly plan with daily goals already wired into the gamification engine.
- Regenerates when mastery or schedule changes meaningfully.

### 7.5 AI Exam Preparation
- Mock exam generator: pulls from concept graph weighted by exam blueprint × student weakness.
- Post-exam: per-question analysis, error taxonomy (conceptual / careless / time / unknown), targeted revision plan.
- Predicted score with confidence interval.

### 7.6 AI Emotional Learning Analysis
- **Affect signals** captured from: response latency, retry patterns, voice prosody (when tutor active), self-reported mood, session abandonment.
- Aggregated into `affect_signals` and combined with burnout score already in `student_engagement`.
- Drives motivation tone, challenge difficulty, and *forced rest* nudges.
- **Privacy:** never exposed to peers; teachers see only aggregated batch-level signals.

### 7.7 AI Mentor System
- Long-running assistant per student with **persistent memory** (vector recall over conversations, mastery, goals).
- Capabilities: explain, motivate, plan week, debrief exam, escalate to human teacher when affect signals warrant.
- Uses tool-calling: `lookup_concept`, `start_quiz`, `schedule_revision`, `notify_teacher`.

### 7.8 Real-Time Adaptive Testing
- IRT-style (Item Response Theory) engine: after each answer, re-estimates ability and picks next item to maximize information.
- Stops when standard error < threshold or time budget elapsed.
- Backed by `concepts.difficulty` and per-item discrimination learned over time.

---

## 8. Folder Layout (v2 additions)

```text
src/lib/ai/
  orchestrator/
    router.server.ts          # model + budget + fallback
    cache.server.ts           # semantic cache
    telemetry.server.ts
  context/
    student-context.server.ts # unified hydration
  runners/
    text.server.ts
    voice.server.ts           # ElevenLabs / Realtime
    vision.server.ts
    image.server.ts
  safety/
    guardrails.server.ts      # PII, age, citation, jailbreak
  memory/
    embeddings.server.ts      # pgvector R/W
    conversations.server.ts
  predictive/
    readiness.server.ts
    at-risk.server.ts
    next-action.server.ts
  curriculum/
    path-generator.server.ts
  exam/
    mock-generator.server.ts
    adaptive-engine.server.ts
  mentor/
    agent.server.ts
    tools.server.ts
  affect/
    signal-collector.server.ts
    analyzer.server.ts
```

Each existing feature (`gamification`, `school-insights`, `quiz`) refactors to call `orchestrator` instead of the gateway directly — a single, contained migration.

---

## 9. Roadmap

| Phase | Theme | Ships |
|---|---|---|
| **2.1 — Foundation** | Orchestrator + Memory | `ai/orchestrator`, `student_embeddings`, semantic cache, telemetry |
| **2.2 — Mentor & Voice** | Conversational AI | AI Mentor (text), Voice Tutor (ElevenLabs), persistent memory |
| **2.3 — Predictive** | Intelligence | Exam readiness, at-risk detection, next-best-action, affect signals |
| **2.4 — Generated Learning** | Content AI | AI-generated lessons, personalized curriculum paths |
| **2.5 — Adaptive Exams** | Assessment AI | IRT engine, mock exam generator, error taxonomy |
| **2.6 — Emotional Intelligence** | Wellbeing | Full affect pipeline, burnout intervention, parent/teacher escalation |

Each phase is independently shippable and backward-compatible.

---

## 10. Non-Negotiables

- **RLS everywhere.** Multi-tenant isolation already enforced; v2 tables follow the same pattern with `school_id` / `user_id` scoping and `SECURITY DEFINER` helpers.
- **No client-side AI keys.** All model calls go through server functions with `requireSupabaseAuth`.
- **Child safety.** Guardrail stage is mandatory; cannot be bypassed by any runner.
- **Cost ceilings.** Every feature declares a budget; orchestrator enforces it.
- **Observability.** Every AI call logged with cost, latency, satisfaction — feeds the roadmap.

---

## 11. Positioning

With v2.0, Smart Lab Online is no longer "an EdTech app with AI features." It becomes a **learning intelligence platform** — the first place a student, parent, teacher, or school turns to *understand* learning, not just deliver it.

This is the foundation that lets SML compete with — and outgrow — global category leaders.
