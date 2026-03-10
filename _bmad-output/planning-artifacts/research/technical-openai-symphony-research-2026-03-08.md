---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'OpenAI Symphony - orchestration of autonomous coding agents'
research_goals: 'Understand architecture, implementation approach, integration patterns, and adoption for teams managing project work via AI coding agents'
user_name: 'Raedmund'
date: '2026-03-08'
web_research_enabled: true
source_verification: true
---

# Research Report: OpenAI Symphony Technical Research

**Date:** 2026-03-08
**Author:** Raedmund
**Research Type:** technical

---

## Research Overview

This technical research covers OpenAI Symphony—a **work queue and process supervisor for LLM coding agents**, not an agent framework. Symphony turns an issue tracker into an agent control plane: it polls Linear, spawns Codex per issue in isolated workspaces, and reconciles state. **Cognition lives in Codex + WORKFLOW.md + skills**; Symphony provides orchestration, retry, and workspace isolation. Key conceptual insight: **issues are compute units**—project management reframed as distributed computation. The report includes a Critical Evaluation section that corrects common framings and clarifies Symphony's role for production agent orchestration (e.g. Meshic, BMAD, multi-agent dev loops).

---

## Technical Research Scope Confirmation

**Research Topic:** OpenAI Symphony - orchestration of autonomous coding agents
**Research Goals:** Understand architecture, implementation approach, integration patterns, and adoption for teams managing project work via AI coding agents

**Technical Research Scope:**
- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Scope Confirmed:** 2026-03-08

---

## Technology Stack Analysis

### Programming Languages

Symphony's reference implementation is built in **Elixir** (94.9% of the codebase) on the Erlang/BEAM runtime. Elixir was chosen for fault tolerance and concurrency—essential for managing autonomous agents performing long-running tasks. BEAM processes are lightweight (~2KB each), support millions of concurrent processes with independent heaps, and handle long-lived connections ideal for agents making sequential LLM API calls. The actor model underlying Erlang/Elixir naturally aligns with AI agent orchestration patterns.

_Source: [MarkTechPost](https://www.marktechpost.com/2026/03/05/openai-releases-symphony-an-open-source-agentic-framework-for-orchestrating-autonomous-ai-agents-through-structured-scalable-implementation-runs/), [George Guimaraes](https://georgeguimaraes.com/your-agent-orchestrator-is-just-a-bad-clone-of-elixir/)_

### Development Frameworks and Libraries

- **OTP/Elixir**: Supervision trees for managing hundreds of isolated implementation runs
- **Phoenix**: Optional LiveView dashboard and JSON API for observability
- **Bandit**: HTTP server for the observability UI
- **mise**: Recommended for Elixir/Erlang version management
- **Mix**: Elixir build tool for setup, build, and tests

_Source: [GitHub openai/symphony](https://github.com/openai/symphony), [elixir/README.md](https://github.com/openai/symphony/blob/main/elixir/README.md)_

### Database and Storage Technologies

The SPEC does not require a persistent database—orchestrator state is in-memory for restart recovery. Some references mention PostgreSQL (Ecto) for state persistence in the Elixir implementation; the spec explicitly supports restart recovery without a durable DB by using tracker-driven and filesystem-driven recovery.

_Source: [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md), [MarkTechPost](https://www.marktechpost.com/2026/03/05/openai-releases-symphony-an-open-source-agentic-framework-for-orchestrating-autonomous-ai-agents-through-structured-scalable-implementation-runs/)_

### Development Tools and Platforms

- **Codex app-server**: Coding agent executable speaking JSON-RPC over stdio
- **Linear**: Default issue tracker (GraphQL API at api.linear.app)
- **Git**: Workspace population via `hooks.after_create` (e.g., `git clone`)
- **WORKFLOW.md**: In-repo contract for prompt template and YAML config

_Source: [developers.openai.com/codex/app-server](https://developers.openai.com/codex/app-server), [Linear Developers](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)_

### Cloud Infrastructure and Deployment

Symphony runs as a persistent daemon on the host. Workspaces use local filesystem under `workspace.root`. No prescribed cloud or container model—deployment is implementation-defined. Recommended: run under a dedicated OS user, restrict workspace root permissions, consider dedicated volume for workspaces.

_Source: [SPEC.md Section 15](https://github.com/openai/symphony/blob/main/SPEC.md)_

---

## Integration Patterns Analysis

### API Design Patterns

- **Linear GraphQL API**: REST-style over GraphQL at `https://api.linear.app/graphql`. Auth via `Authorization` header (API key or OAuth 2.0). Pagination required for candidate issues (default page size 50).
- **Codex JSON-RPC 2.0**: Bidirectional protocol over stdio (newline-delimited JSON) or WebSocket. Methods: `initialize`, `thread/start`, `turn/start`, `turn/completed`, `turn/failed`, etc.
- **linear_graphql tool**: Optional client-side tool exposing raw Linear GraphQL to the agent session using Symphony's tracker auth.

_Source: [Codex App Server](https://developers.openai.com/codex/app-server), [Linear Developers](https://developers.linear.app/docs/graphql/working-with-the-graphql-api), [SPEC.md Section 10.5](https://github.com/openai/symphony/blob/main/SPEC.md)_

### Communication Protocols

- **stdio**: Default transport for Codex—line-delimited JSON, max line size 10MB recommended
- **HTTP/HTTPS**: Linear API, optional Phoenix dashboard/API
- **WebSocket**: Experimental Codex transport (one JSON-RPC message per frame)

_Source: [Codex App Server](https://developers.openai.com/codex/app-server)_

### Data Formats and Standards

- **JSON**: All protocol messages, API responses
- **YAML**: WORKFLOW.md front matter for config
- **Markdown**: Prompt template body, Liquid-compatible templating with `issue` and `attempt` variables

_Source: [SPEC.md Sections 5–6](https://github.com/openai/symphony/blob/main/SPEC.md)_

### System Interoperability Approaches

Symphony acts as a **scheduler/runner and tracker reader**. Ticket writes (state transitions, comments, PR links) are performed by the coding agent via workflow tools, not by the orchestrator. The boundary is explicit: Symphony orchestrates; the agent executes and mutates tracker state.

_Source: [SPEC.md Section 1, 11.5](https://github.com/openai/symphony/blob/main/SPEC.md)_

---

## Architectural Patterns and Design

### System Architecture Patterns

Symphony is best understood as a **specialized distributed job queue** (like Celery/Sidekiq) for coding agents. A single orchestrator owns the poll tick, dispatch, retry, and reconciliation. Six abstraction layers:

1. **Policy Layer** – WORKFLOW.md prompt, team rules
2. **Configuration Layer** – Typed getters, defaults, env resolution
3. **Coordination Layer** – Polling loop, eligibility, concurrency, retries
4. **Execution Layer** – Workspace lifecycle, agent subprocess
5. **Integration Layer** – Linear adapter
6. **Observability Layer** – Logs, optional status surface

_Source: [SPEC.md Section 3.2](https://github.com/openai/symphony/blob/main/SPEC.md), [AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)_

### Design Principles and Best Practices

- **Single authority**: Orchestrator serializes state mutations to avoid duplicate dispatch
- **Deterministic workspaces**: Per-issue paths, sanitized keys, root containment—solves agent determinism (corrupted dirs, partial files, broken envs) by isolation
- **In-repo policy**: WORKFLOW.md versioned with code
- **Dynamic reload**: Watch WORKFLOW.md, re-apply without restart
- **Restart recovery**: Tracker-driven + filesystem-driven, no durable DB required

_Source: [SPEC.md Sections 6.2, 7.4, 9](https://github.com/openai/symphony/blob/main/SPEC.md)_

### Scalability and Performance Patterns

- **Bounded concurrency**: `max_concurrent_agents` (default 10), optional `max_concurrent_agents_by_state`
- **Exponential backoff**: `delay = min(10000 * 2^(attempt-1), max_retry_backoff_ms)`
- **Stall detection**: `codex.stall_timeout_ms` (default 5m) kills inactive sessions
- **Continuation retries**: 1s delay after normal exit to re-check active state

_Source: [SPEC.md Sections 8.3, 8.4, 8.5](https://github.com/openai/symphony/blob/main/SPEC.md)_

### Security Architecture Patterns

- **Workspace isolation**: Agent cwd must equal per-issue workspace path; path must be under workspace root
- **Secret handling**: `$VAR` indirection, no logging of tokens
- **Hook safety**: Hooks are trusted config; timeouts required (`hooks.timeout_ms` default 60s)
- **Harness hardening**: Approval/sandbox policy implementation-defined; spec recommends tightening Codex settings, external isolation, credential scoping

_Source: [SPEC.md Section 15](https://github.com/openai/symphony/blob/main/SPEC.md)_

---

## Implementation Approaches and Technology Adoption

### Technology Adoption Strategies

- **Harness engineering prerequisite**: Symphony works best where teams already use Codex effectively. **Harness > orchestration**—without tests, lint, sandbox, and repo reset capability, agents will loop, break tests, generate junk commits, and corrupt the repo. Adopt harness practices first, then add Symphony for work-queue automation.
- **Two paths**: (1) Implement from SPEC.md in any language, or (2) Use the experimental Elixir reference.
- **Gradual rollout**: Start with trusted environments; spec is a "low-key engineering preview."

_Source: [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/), [GitHub README](https://github.com/openai/symphony)_

### Development Workflows and Tooling

- **mise**: `mise install`, `mise exec -- mix setup`, `mise exec -- mix build`
- **WORKFLOW.md**: Copy to repo, customize project slug, active/terminal states, hooks
- **Skills**: Optional copy of `commit`, `push`, `pull`, `land`, `linear` from `.codex/`
- **Linear workflow**: Custom statuses (Rework, Human Review, Merging) configurable in Team Settings

_Source: [elixir/README.md](https://github.com/openai/symphony/blob/main/elixir/README.md)_

### Deployment and Operations Practices

- **CLI**: `./bin/symphony ./WORKFLOW.md` or custom path
- **Flags**: `--logs-root`, `--port` for Phoenix dashboard
- **Observability**: Structured logs (issue_id, issue_identifier, session_id); optional `/`, `/api/v1/state`, `/api/v1/<issue_id>`, `POST /api/v1/refresh`
- **Recovery**: Restart triggers startup terminal cleanup, fresh poll, re-dispatch

_Source: [SPEC.md Sections 13, 14](https://github.com/openai/symphony/blob/main/SPEC.md)_

### Risk Assessment and Mitigation

- **Trust boundary**: Each implementation defines its own; document approval/sandbox posture
- **Tracker data**: May contain sensitive content; filter dispatch scope
- **linear_graphql**: Narrow to project scope rather than workspace-wide access
- **Hook scripts**: Arbitrary shell from WORKFLOW.md; validate and limit scope

_Source: [SPEC.md Section 15.5](https://github.com/openai/symphony/blob/main/SPEC.md)_

---

## Conceptual Refinement & Critical Evaluation

*This section incorporates critical evaluation for production agent orchestration (e.g. Meshic, BMAD, multi-agent dev loops).*

### 1. Symphony's Real Architecture: What It Actually Is

Symphony is **not** an agent framework. It is a **work queue + process supervisor for LLM agents**.

```
Issue Tracker (Linear)
        │
        ▼
Symphony Orchestrator (poll / dispatch)
        │
        ▼
Workspace Manager
        │
        ▼
Agent Runtime (Codex app-server)
        │
        ▼
Git + repo mutation
        │
        ▼
Issue update / PR
```

**Symphony does not implement agent reasoning or planning.** Those responsibilities live in:
- Codex agent prompt
- WORKFLOW.md
- Agent skills

The stack separation is deliberate:

| Component | Responsibility |
|-----------|----------------|
| **Symphony** | Orchestration (queue, dispatch, retry, workspace lifecycle) |
| **Codex** | Cognition (reasoning, planning, tool use) |
| **Repo** | Context (codebase, story files) |
| **Tracker** | Queue (work items, state machine) |

### 2. Tracker-Driven Orchestration (Key Design Decision)

The central concept is **tracker-driven agent orchestration**—not chat-driven, event-driven, or DAG workflows.

```
Issue state = agent state machine
```

Example flow:
```
Backlog → Ready for AI → Implementing → Human Review → Merged
```

Symphony polls the tracker and converts state transitions into agent runs.

**Advantages:**
- No custom orchestration UI
- Work remains visible in normal dev tools (Linear, GitHub)
- Audit trail stays in tracker
- Humans stay in loop naturally

This is a **different paradigm** from most agent frameworks.

### 3. Symphony as Specialized Distributed Job Queue

Internally Symphony behaves like **Celery / Sidekiq—but for coding agents**.

Core loop:
```
poll tracker → identify eligible issues → spawn run → monitor → retry / reconcile
```

The **Elixir choice becomes obvious**: BEAM excels at long-lived processes, fault tolerance, supervision trees, and retry loops—exactly what Symphony needs.

### 4. Deterministic Workspaces (Critical Design Feature)

Each issue receives a **dedicated filesystem workspace**:

```
workspace/
   ISSUE-421/
        repo clone
        branch
        logs
```

**Why this matters:** It solves **agent determinism problems**. Agents frequently corrupt working directories, leave partial files, or break environments. Workspace isolation prevents contamination across runs. This is a major engineering insight.

### 5. What Symphony Does NOT Solve

Symphony is **agent execution infrastructure**, not a full agent platform. It does NOT provide:

| Gap | Implication |
|-----|-------------|
| **Multi-agent collaboration** | No agent swarm; each issue = one agent session |
| **Tool orchestration** | Codex handles tools; Symphony does not |
| **Planning layer** | No planning engine |
| **Dependency graph** | Issues are not a DAG |
| **Memory layer** | No long-term knowledge store |

### 6. Harness Engineering: The Real Bottleneck

Harness engineering is **understated** in adoption discussions. It is **the real bottleneck**.

Without a strong harness, agents will:
- Loop indefinitely
- Break tests
- Generate junk commits
- Corrupt the repo

A good harness includes: test suite, linting, formatting, build validation, sandboxing, repo reset capability.

**In practice: Harness > orchestration.** Most teams underestimate this.

### 7. Comparison with Other Agent Orchestration Systems

Symphony sits in a **unique category**:

| System | Role |
|--------|------|
| LangGraph | Agent reasoning DAG |
| AutoGPT | Task execution agent |
| CrewAI | Multi-agent collaboration |
| Temporal | Workflow orchestration |
| Prefect | DAG orchestration |
| n8n | Integration automation |
| **Symphony** | **Coding agent job queue** |

### 8. Why Symphony Matters

The innovation is not the agents—it is **developer workflow integration**.

The system turns:
```
issue tracker → agent control plane
```

Example: Create issue → Agent builds feature → PR appears → Human reviews.

This becomes **AI-native software development**.

### 9. Symphony + BMAD (Complementary Systems)

- **BMAD** defines: agent roles, workflows, skills, thinking patterns
- **Symphony** provides: execution engine, queue, retry, workspace isolation

Architecture together:
```
BMAD workflow → Issue generation → Symphony dispatch → Codex agent → Repo changes
```

This combination is **very powerful** for structured AI-driven development.

### 10. Why Elixir Was a Clever Choice

| Language | Problem |
|----------|---------|
| Node | Weak supervision model |
| Python | Poor concurrency |
| Go | Manual orchestration complexity |

BEAM gives: process supervision, message passing, fault isolation, restart trees—which map perfectly to **agent lifecycle management**.

### 11. Future Evolution (What Symphony May Add)

- **Multi-agent runs**: planner, coder, tester, reviewer
- **Dependency graph**: issue DAG
- **Memory layer**: knowledge index, context store
- **Event-driven triggers**: instead of polling
- **Cluster scaling**: multiple orchestrators

### 12. Key Conceptual Insight: Issues as Compute Units

Symphony treats **issues as compute units**.

Traditional software: `function = compute unit`  
Symphony: `issue = compute unit`

That reframes project management as a **distributed computation system**.

### 13. Recommended Adoption Architecture

```
Linear / GitHub Issues
        │
        ▼
Symphony
        │
        ▼
Codex agents
        │
        ▼
Repo
        │
        ▼
CI harness
```

Add: observability, sandbox, agent cost controls.

### 14. Final Assessment

Symphony is essentially an **AI-native developer job queue** built around:
- Issue tracker as control plane
- Workspace isolation
- Agent supervision
- Retry loops

---

## Technical Research Synthesis

### Executive Summary

OpenAI Symphony is a **work queue and process supervisor for LLM coding agents**—not an agent framework. It turns an issue tracker into an agent control plane: poll Linear → spawn Codex per issue in isolated workspaces → reconcile state. **Cognition lives in Codex + WORKFLOW.md + skills**; Symphony provides orchestration only. The key insight: **issues are compute units**—project management reframed as distributed computation. Tracker-driven orchestration (issue state = agent state machine) avoids custom UIs and keeps work visible in normal dev tools. Deterministic per-issue workspaces solve agent determinism. Harness engineering is the real bottleneck: **Harness > orchestration**—most teams underestimate this.

**Key Technical Findings:**
- Symphony = orchestration; Codex = cognition; Repo = context; Tracker = queue
- Specialized distributed job queue (Celery/Sidekiq for coding agents)
- Six-layer architecture: Policy → Config → Coordination → Execution → Integration → Observability
- No multi-agent, planning, dependency graph, or memory layer
- Distinct from LangGraph, CrewAI, Temporal—Symphony is a coding agent job queue

**Technical Recommendations:**
1. **Harness first:** Adopt harness engineering (tests, lint, sandbox, reset) before Symphony
2. Implement from SPEC.md for production; Elixir reference is prototype
3. Document trust/safety posture and approval/sandbox policy explicitly
4. Use `linear_graphql` narrowly; restrict workspace root and run under dedicated user
5. Add observability, sandbox, and agent cost controls to adoption architecture

### Sources

- [GitHub openai/symphony](https://github.com/openai/symphony)
- [SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)
- [elixir/README.md](https://github.com/openai/symphony/blob/main/elixir/README.md)
- [Codex App Server](https://developers.openai.com/codex/app-server)
- [Harness Engineering](https://openai.com/index/harness-engineering/)
- [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [MarkTechPost Symphony Overview](https://www.marktechpost.com/2026/03/05/openai-releases-symphony-an-open-source-agentic-framework-for-orchestrating-autonomous-ai-agents-through-structured-scalable-implementation-runs/)
- [AI Agent Orchestration Patterns - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)

---

**Technical Research Completion Date:** 2026-03-08
**Source Verification:** All facts cited from official SPEC, README, and current web sources
