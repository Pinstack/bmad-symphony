---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'OpenAI Symphony × BMAD-Method Integration'
research_goals: 'Determine whether Symphony can serve as the execution/orchestration substrate for BMAD-Method workflows, agents, and skills in teams managing project work through AI coding agents'
user_name: 'Raedmund'
date: '2026-03-08'
web_research_enabled: true
source_verification: true
---

# Research Report: OpenAI Symphony × BMAD-Method Integration

**Date:** 2026-03-08
**Author:** Raedmund
**Research Type:** technical

---

## Research Overview

This report evaluates how OpenAI Symphony could integrate with BMAD-Method, not how Symphony fits a product codebase. The central conclusion is that the two systems occupy different layers: **BMAD-Method is best understood as a workflow/methodology and agent-guidance layer**, while **Symphony is a tracker-driven orchestration and execution-control layer**. BMAD publicly presents itself as a framework with 34+ workflows, 12+ specialised agents, guided commands such as `bmad-help`, and a Builder for custom agents, workflows, and modules. Symphony's spec defines a long-running service that reads work from an issue tracker, creates isolated per-issue workspaces, runs coding agents, keeps workflow policy in WORKFLOW.md, and acts as a scheduler/runner rather than the source of cognition.

The current public documentation reviewed here does not describe a packaged, official BMAD↔Symphony integration. What it does show is a strong architectural fit: BMAD already organises development work into structured workflows and reusable skills, while Symphony is designed to turn tracker items into isolated agent runs. That makes BMAD a plausible upstream methodology layer for Symphony, provided BMAD workflows can be externalised into tracker-visible, machine-dispatchable work units. This is an inference from the current public docs, not an officially documented integration.

---

## Technical Research Scope Confirmation

**Research Topic:** OpenAI Symphony × BMAD-Method Integration
**Research Goal Reframed:** Determine whether Symphony can serve as the execution/orchestration substrate for BMAD-Method workflows, agents, and skills in teams managing project work through AI coding agents.

**Scope covered:**
- Symphony architecture and operational boundary
- BMAD-Method architecture and delivery model
- Integration patterns between BMAD and Symphony
- Runtime and protocol implications
- Workflow/state-model implications
- Adoption constraints and recommended implementation path

**Scope Confirmed:** 2026-03-08

---

## Current-State Technical Baseline

### BMAD-Method v6

BMAD-Method v6 is positioned as an AI-driven agile development framework with:
- Structured workflows across analysis, planning, architecture, and implementation
- Specialised agents (12+ domain experts)
- Interactive guidance via `bmad-help`
- Support for assistants that accept custom system prompts or project context
- Official mention of Claude Code, Cursor, and **Codex CLI**

The **Builder module** is specifically described as a way to create custom agents, workflows, and modules. BMAD's roadmap explicitly includes:
- Universal Skills Architecture
- Adaptive skills for multiple runtimes
- Builder support for production-ready agents and workflows with evals, teams, and graceful degradation

### Symphony

Symphony is defined as a long-running automation service that:
- Reads work from an issue tracker
- Creates an isolated workspace for each issue
- Runs a coding agent session inside that workspace

The spec is explicit: **Symphony is a scheduler/runner and tracker reader**; ticket writes are typically performed by the coding agent through tools in the runtime environment. The current Elixir implementation is described as prototype software intended for evaluation only; OpenAI recommends building a hardened implementation from SPEC.md.

### Conceptual Stack

| Layer | Responsibility |
|-------|----------------|
| **BMAD-Method** | Methodology / workflow / skills / agent guidance |
| **Symphony** | Scheduling / supervision / workspace isolation / retries |
| **Runtime** | Execution engine (e.g. Codex) |
| **Harness** | Tests / validation / quality gates |
| **Tracker** | Control-plane state |

This layering is the core of the integration case. BMAD and Symphony should be treated as **complements, not substitutes**.

---

## Architecture Analysis

### Symphony's Role

Symphony's spec centres on four operational properties:
1. Repeatable daemon execution
2. Per-issue workspace isolation
3. In-repo workflow policy via WORKFLOW.md
4. Enough observability to debug concurrent agent runs

The Elixir reference currently:
- Polls Linear
- Creates isolated workspaces
- Launches Codex in app-server mode
- Sends a workflow prompt
- Can expose a `linear_graphql` tool to the running session

The spec is currently Linear-specific, but explicitly lists pluggable tracker adapters as future work. Linear should be treated as the current reference integration, not the permanent architectural boundary.

### BMAD's Role

BMAD's public materials describe a structured development framework:
- Guided workflows across analysis, planning, architecture, and implementation
- Specialised agents
- `bmad-help` as a primary task router
- BMad Builder for custom agents, workflows, and modules

The roadmap signals runtime portability and skill normalisation across assistants. The net effect: **BMAD is a workflow-definition and cognition-scaffolding system**, not an execution scheduler.

### Architectural Fit

| Symphony solves | BMAD solves |
|-----------------|-------------|
| **When** a task runs | **How** the task should be approached |
| **Where** it runs (workspace isolation) | **What** workflow applies |
| **Under what isolation** | **Which** skill/agent persona to invoke |
| | **How** a human is guided through the process |

That is the cleanest interpretation of the public material.

---

## Integration Patterns

### Pattern 1: BMAD Above Symphony — Recommended

This is the stronger model.

```
BMAD workflow / Builder artefacts
        ↓
issue templates + issue generation + state model
        ↓
tracker
        ↓
Symphony dispatch
        ↓
runtime session
        ↓
repo mutation + validation + review
```

In this model, BMAD defines the workflow semantics and task decomposition upstream. Symphony then consumes those tasks as queue items. This preserves BMAD's value as a methodology layer and uses Symphony exactly where it is strongest: dispatch, workspace isolation, retries, and run supervision. This pattern is an architectural inference, but it aligns cleanly with BMAD Builder's role and Symphony's spec.

### Pattern 2: BMAD Inside Each Symphony Run — Secondary

This is the lighter-weight model.

```
tracker issue
    ↓
Symphony run
    ↓
runtime loads BMAD skills/workflow instructions
    ↓
agent executes issue
```

Easier to prototype because it does not require BMAD to become the upstream issue factory. But weaker strategically: BMAD stays trapped inside the run rather than shaping the queue and state machine. You gain BMAD-flavoured execution, but not BMAD-governed orchestration.

---

## Runtime and Protocol Implications

BMAD's docs explicitly say it works with assistants that support custom system prompts or project context, and name **Codex CLI** as one of the supported options. Symphony's current Elixir reference launches Codex in **app-server mode**.

OpenAI's Codex docs describe app-server as the interface for embedding Codex into a product, using bidirectional JSON-RPC over stdio or WebSocket. The same docs also say: **if you are automating jobs or running Codex in CI, you should use the Codex SDK instead**.

That creates a real design nuance for BMAD integration:
- The reference Symphony path is app-server-driven today
- A hardened production integration may want to move toward SDK-driven execution or abstract the runtime boundary more carefully

BMAD's roadmap is pushing toward runtime portability. If BMAD skills become genuinely "write once, run everywhere", and adaptive skills mature across Claude, Codex, Kimi, OpenCode, and others, then the BMAD layer becomes increasingly portable into Symphony-controlled runs regardless of runtime. **BMAD's own roadmap makes Symphony integration more plausible over time, not less.**

---

## What BMAD Must Provide for Symphony Compatibility

The core integration challenge is not whether Symphony can launch an agent. It can. The challenge is **whether BMAD workflows can be made machine-dispatchable**.

That requires at least four things:

| Requirement | Description |
|-------------|-------------|
| **Workflow granularity** | BMAD workflows must decompose into issue-sized units rather than remain purely interactive, session-scale guidance. BMAD currently shines in guided, human-facing flow control through `bmad-help`. Symphony wants explicit queued work items. |
| **State mapping** | BMAD phases and hand-offs need explicit tracker states that Symphony can observe and act on. Symphony already models workflow-defined hand-off states such as Human Review; BMAD would need an equivalent tracker-visible state machine rather than only IDE-local progression. |
| **Skill portability** | BMAD skills and workflow artefacts need to execute cleanly under the target runtime used by Symphony. BMAD's roadmap suggests this is exactly where the project is heading (Universal Skills Architecture, Adaptive Skills). |
| **Harness compatibility** | Symphony's README says it works best in codebases that have adopted harness engineering. BMAD can help structure the work, but does not remove the need for tests, validation, and quality gates. BMAD's TEA module strengthens the case that validation should remain a distinct layer. |

---

## Implementation Approach

The most sensible implementation path is to treat **BMad Builder as the integration surface**. Builder already exists to define custom agents, workflows, and modules. That makes it the natural place to add Symphony-oriented export or transformation capabilities:
- Generate issue templates
- Tracker-state maps
- Skill bundles
- WORKFLOW.md fragments that Symphony can consume

This is not described as an official feature today; it is the most logical extension point visible in the public BMAD architecture.

### Minimal Viable Integration

```
BMad Builder / workflow definitions
        ↓
generate issue templates + tracker states + run metadata
        ↓
tracker board
        ↓
Symphony dispatches eligible issues
        ↓
Codex runtime executes with BMAD-aligned prompt/skills
        ↓
tests / harness / review gate
```

This preserves the layer separation and avoids forcing Symphony to become a methodology engine or BMAD to become a scheduler.

---

## Adoption and Risk Assessment

Three blunt realities:

**1. Symphony is still early**
- Spec is Draft v1
- Repo calls it a low-key engineering preview
- Elixir implementation is explicitly prototype software for evaluation
- A serious BMAD integration should assume custom hardening work, not a ready-made production stack

**2. BMAD is interactive-first**
- Current public docs emphasise interactive guided use inside AI IDEs and assistants
- The integration burden is not zero: someone must translate BMAD's guided workflow semantics into issue/state semantics that Symphony can dispatch

**3. Runtime choice is fluid**
- BMAD names Codex CLI as supported
- Symphony currently launches Codex app-server
- OpenAI recommends the Codex SDK for job automation and CI
- Safest strategic move: design a runtime abstraction, not weld BMAD permanently to the current app-server prototype

---

## Final Assessment

The correct framing is:

| Component | Role |
|-----------|------|
| **BMAD-Method** | Workflow and cognition scaffold |
| **Symphony** | Orchestration and execution control plane |
| **Runtime** | Coding-agent engine |
| **Harness** | Validation and safety loop |

On that framing, BMAD and Symphony are **strongly complementary**. BMAD gives structure, roles, workflow logic, and reusable skills. Symphony gives queueing, workspace isolation, retries, observability, and supervision.

The integration is technically credible, but it is **not an out-of-the-box packaged integration** in the current public docs. The real work is:
1. Converting BMAD workflows into tracker-driven, stateful, dispatchable units
2. Choosing the right runtime boundary for production

**The strongest conclusion:** Symphony is a plausible operational backbone for BMAD-Method at scale, but only if BMAD is externalised from an IDE-local guidance system into a tracker-visible workflow system. If that translation is done well, BMAD can define **how** work should be performed, while Symphony governs **when** and **where** it runs.

---

## Sources

- https://github.com/openai/symphony
- https://github.com/openai/symphony/blob/main/SPEC.md
- https://github.com/openai/symphony/blob/main/elixir/README.md
- https://developers.openai.com/codex/app-server/
- https://developers.openai.com/codex/cli/reference/
- https://docs.bmad-method.org/
- https://docs.bmad-method.org/reference/modules/
- https://docs.bmad-method.org/reference/commands/
- https://docs.bmad-method.org/roadmap/
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md
- https://github.com/bmad-code-org/BMAD-METHOD/releases

---

**Technical Research Completion Date:** 2026-03-08
**Source Verification:** Official repos, SPEC, BMAD docs, roadmap
