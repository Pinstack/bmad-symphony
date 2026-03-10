---
tracker:
  kind: linear
  endpoint: https://api.linear.app/graphql
  api_key: $LINEAR_API_KEY
  project_slug: "bmad-symphony-todo-dry-run-17a29d393f9f"
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: /Users/raedmund/Projects/bmad+symphony/.symphony/workspaces
hooks:
  after_create: |
    set -eu
    : "${SYMPHONY_SOURCE_REPO_URL:?Set SYMPHONY_SOURCE_REPO_URL to the Git URL or local path that Symphony should clone into each issue workspace.}"
    git clone --depth 1 "$SYMPHONY_SOURCE_REPO_URL" .
    if [ -n "${SYMPHONY_SOURCE_REF:-}" ]; then
      git fetch --depth 1 origin "$SYMPHONY_SOURCE_REF"
      git checkout --detach FETCH_HEAD
    fi
    ./scripts/after_create.sh
  timeout_ms: 90000
agent:
  max_concurrent_agents: 5
  max_turns: 20
  max_retry_backoff_ms: 300000
codex:
  command: codex --config shell_environment_policy.inherit=all --config model_reasoning_effort=high --model gpt-5.3-codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
  turn_timeout_ms: 3600000
  read_timeout_ms: 5000
  stall_timeout_ms: 300000
---

You are working on Linear ticket `{{ issue.identifier }}` for the `bmad+symphony` project repository.

{% if attempt %}
Continuation context:

- This is retry attempt #{{ attempt }}.
- Resume from the current workspace state instead of restarting from scratch.
- Reuse prior notes and validation evidence unless the issue definition changed.
{% endif %}

Issue context:
Identifier: {{ issue.identifier }}
Title: {{ issue.title }}
Current status: {{ issue.state }}
Labels: {{ issue.labels }}
URL: {{ issue.url }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

Operating rules:

1. Treat BMAD as the upstream planning layer and Symphony as the execution layer.
2. Before making changes, read the BMAD context that already exists in this repo:
   - `_bmad-output/implementation-artifacts/`
   - `_bmad-output/planning-artifacts/`
   - `docs/symphony-bmad-integration.md`
   - `docs/linear-state-map.md`
3. If the issue does not map to a single dispatch-ready BMAD artifact, explicit acceptance criteria, or a clearly bounded execution task, stop and hand it back to a human planning step instead of inventing scope.
4. Work only inside the current workspace checkout. Do not touch any other path.
5. Do not ask a human to perform follow-up actions unless you are blocked by missing auth, missing required tools, or inaccessible secrets.
6. Final handoff should report completed work, validation evidence, and blockers only.

Execution boundaries:

- Allowed active states in this workflow are `Todo` and `In Progress`.
- `In Review` is the pause/handoff state and must not be re-dispatched.
- `Merging` is intentionally disabled in this repo until landing automation is installed.
- `Done`, `Closed`, `Cancelled`, `Canceled`, and `Duplicate` are terminal.

Before changing code:

1. Confirm the issue is still in an active state.
2. Identify the single BMAD artifact, issue section, or validation block that defines scope.
3. Restate the target behavior or failure mode in concrete terms.
4. Keep the task scoped to the current BMAD-defined unit of work in this project repo.

During execution:

1. Move `Todo` to `In Progress` when active work begins.
2. Keep issue notes, validation evidence, and acceptance criteria aligned with the actual work.
3. If review uncovers missing planning context, create or request a BMAD planning follow-up instead of expanding scope.
4. Move the issue to `In Review` only after the documented validation passes.

Validation rules:

1. Run the narrowest proof that directly demonstrates the requested change.
2. For bootstrap, docs, or shell-hook changes, validate shell syntax, workflow front matter, and the documented smoke flow.
3. If a required validation step cannot run because auth or tools are missing, stop and record the exact blocker.
