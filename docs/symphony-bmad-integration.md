# Symphony + BMAD Integration Model

## Layering

This repository treats BMAD and Symphony as complementary layers inside a single project-repo setup:

| Layer | Responsibility |
| ---- | ------- |
| BMAD | Defines planning artifacts, stories, acceptance criteria, and handoff points inside the project repo. |
| Linear | Holds the dispatchable issue that points at one BMAD-defined unit of work. |
| Symphony | Polls Linear, creates isolated workspaces, and launches Codex runs. |
| Codex | Executes the current issue inside the workspace and validates the requested change. |

BMAD remains upstream. Symphony should not invent scope, rewrite planning artifacts, or turn one issue into a multi-phase workflow on its own.

In the recommended starting model, this same repo is both:

- the place where BMAD artifacts live, and
- the repo Symphony clones into isolated per-issue workspaces.

## Dispatch-ready issue contract

Each Symphony-dispatchable Linear issue should represent exactly one BMAD execution unit in this project repo.

Minimum contract:

1. The issue references one authoritative artifact or one clearly bounded execution request.
2. The issue includes explicit acceptance criteria or a validation section.
3. The issue can be completed without starting a new BMAD phase mid-run.
4. Any missing planning context is treated as a blocker, not an invitation to improvise.

Recommended issue description sections:

- `Context`: links or paths to the BMAD artifact that defines the work.
- `Acceptance Criteria`: the pass/fail checks for the task.
- `Validation`: the commands or manual flow that must be executed before handoff.

## Artifact mapping

| Location | Meaning | Symphony behavior |
| ---- | ------- | ------- |
| `_bmad-output/planning-artifacts/` | upstream discovery, research, architecture, and planning context | read for context only; do not treat as implementation scope unless the issue explicitly says so |
| `_bmad-output/implementation-artifacts/` | execution-ready artifacts such as stories or quick specs | preferred source of truth for dispatched work |
| `docs/` | repo-local runbooks and state policy | always available as local operating guidance |
| `_bmad/` | BMAD workflow and module definitions | reference when the issue explicitly requires BMAD workflow behavior |

## Handoff rules

- Planning work stays human-driven unless the issue explicitly requests a BMAD planning artifact update.
- Execution work starts only when the issue is already scoped tightly enough for unattended implementation.
- `In Review` is the primary handoff state from Symphony back to a person.
- For this first dry run, reviewer-requested changes should be moved back to `In Progress` instead of using a separate `Rework` status.

## What stays upstream

These decisions must be made before Symphony dispatches the work:

- whether the issue belongs to planning or implementation,
- which BMAD artifact is authoritative,
- which acceptance criteria are mandatory,
- whether the task is in scope for a single run.

## What stays in-run

These decisions can be made during execution:

- which files to edit,
- which narrow validation steps best prove the requested change,
- whether the task is blocked by missing tools, auth, or secrets.

## Non-goals

- No vendored Symphony runtime inside this repository.
- No tracker abstraction beyond Linear in v1.
- No automatic `Merging` state handling until repo-local landing automation exists.
