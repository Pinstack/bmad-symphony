# bmad+symphony

This repository is a BMAD-enabled project testbed for running OpenAI Symphony against BMAD-governed work. Symphony stays external as the long-running orchestrator. This repo holds the app-facing `WORKFLOW.md`, the workspace bootstrap hook, and the BMAD artifacts and docs that define what Symphony should execute.

## What lives here

- `WORKFLOW.md`: the repo-local Symphony contract for Linear polling, workspace creation, Codex runtime settings, and the execution prompt.
- `scripts/after_create.sh`: the idempotent workspace bootstrap check that runs after a new issue workspace is cloned.
- `docs/symphony-bmad-integration.md`: the BMAD-to-Symphony operating model.
- `docs/linear-state-map.md`: the Linear state contract for this repo.
- `app/`: the tiny browser-based todo app used for the first dry run.
- `_bmad/`: BMAD module assets and workflows.
- `_bmad-output/`: generated planning and implementation artifacts used as execution context.

## Repo model

Use this setup as follows:

- this repo = the project repo Symphony clones into per-issue workspaces,
- BMAD artifacts stay in this repo and define the planning and execution context,
- Symphony runs outside the repo and polls Linear,
- Linear issues point to BMAD-defined units of work,
- Codex executes the issue inside a cloned workspace of this repo.

You do not need a separate "Symphony repo" for a first dry run. The simpler setup is: project repo + external Symphony runtime.

## Prerequisites

- A local install of the OpenAI Symphony reference runtime.
- `git` on `PATH`.
- `codex` on `PATH`.
- A Linear personal API key exported as `LINEAR_API_KEY`.
- A cloneable source URL or local path exported as `SYMPHONY_SOURCE_REPO_URL`.

Optional:

- `SYMPHONY_SOURCE_REF` if workspaces should be pinned to a branch, tag, or commit.
- `shellcheck` for local validation of the workspace hook.

## Git bootstrap

This directory now contains a `.git` directory. If you recreate the workspace elsewhere and the repo is not yet initialized, run:

```bash
git init -b main
```

Before Symphony can clone this repo as a source workspace, create an initial commit and, if needed, add a remote:

```bash
git add .
git commit -m "Bootstrap Symphony + BMAD policy layer"
git remote add origin https://github.com/Pinstack/bmad-symphony.git
```

For a local-only smoke test before pushing to a hosted remote, you can point Symphony at the current repo path:

```bash
export SYMPHONY_SOURCE_REPO_URL="$PWD"
export SYMPHONY_SOURCE_REF=main
```

## Configure the workflow

1. Open [WORKFLOW.md](/Users/raedmund/Projects/bmad+symphony/WORKFLOW.md).
2. Change `tracker.project_slug` from `bmad-symphony` to the actual Linear project slug you want Symphony to poll.
3. Leave `tracker.api_key` as `$LINEAR_API_KEY` unless you have a different secret-loading policy.
4. Keep `workspace.root` inside `.symphony/workspaces` unless you intentionally want workspaces elsewhere.
5. The workflow is already aligned to your current `MES` team statuses and uses `In Review` as the human handoff state.

For the first dry run, use the tiny todo app in `app/` and the accompanying BMAD execution artifact in [_bmad-output/implementation-artifacts/todo-app-dry-run.md](/Users/raedmund/Projects/bmad+symphony/_bmad-output/implementation-artifacts/todo-app-dry-run.md).

## Environment variables

```bash
export LINEAR_API_KEY="<linear-personal-api-key>"
export SYMPHONY_SOURCE_REPO_URL="<git-url-or-local-path>"
export SYMPHONY_SOURCE_REF="main"
```

`LINEAR_API_KEY` is required by Symphony to poll Linear.

`SYMPHONY_SOURCE_REPO_URL` is required by the `hooks.after_create` script in [WORKFLOW.md](/Users/raedmund/Projects/bmad+symphony/WORKFLOW.md). It is the repository Symphony clones into each issue workspace.

`SYMPHONY_SOURCE_REF` is optional. When set, the workspace hook fetches and checks out that ref after cloning.

## Start Symphony

The current reference runtime lives outside this repo. Once the Symphony runtime is installed, start it with this repository's workflow file:

```bash
cd /path/to/openai/symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
mise exec -- ./bin/symphony /absolute/path/to/bmad+symphony/WORKFLOW.md --logs-root /absolute/path/to/bmad+symphony/.symphony/logs
```

If you want the optional observability UI, add `--port 4000`.

## Local validation

Validate the hook script syntax:

```bash
sh -n scripts/after_create.sh
shellcheck scripts/after_create.sh
```

Validate the workflow front matter by parsing it as YAML:

```bash
ruby -e 'require "yaml"; raw = File.read("WORKFLOW.md"); front = raw.split(/^---\s*$\n?/)[1]; YAML.safe_load(front, permitted_classes: [], aliases: false); puts "WORKFLOW front matter OK"'
```

Smoke-test the workspace bootstrap logic without starting Symphony:

```bash
tmpdir="$(mktemp -d)"
mkdir -p "$tmpdir/SMOKE-1"
(
  cd "$tmpdir/SMOKE-1"
  git clone --depth 1 "$SYMPHONY_SOURCE_REPO_URL" .
  if [ -n "${SYMPHONY_SOURCE_REF:-}" ]; then
    git fetch --depth 1 origin "$SYMPHONY_SOURCE_REF"
    git checkout --detach FETCH_HEAD
  fi
  ./scripts/after_create.sh
)
```

Expected result:

- the clone succeeds,
- `scripts/after_create.sh` exits cleanly,
- `.symphony/bootstrap-context.txt` is created inside the workspace clone.

## State model

The active workflow for this repo is:

```text
Backlog -> Todo -> In Progress -> Human Review -> Done
                        ^             |
                        |             v
                     Rework <---------
```

`In Review` is intentionally a paused state and is not dispatchable. `Merging` is documented as an optional later extension once repo-local landing automation exists.

See [docs/linear-state-map.md](/Users/raedmund/Projects/bmad+symphony/docs/linear-state-map.md) for the full contract and [docs/symphony-bmad-integration.md](/Users/raedmund/Projects/bmad+symphony/docs/symphony-bmad-integration.md) for the BMAD execution model.

## Recommended first dry run

1. Use the baseline app in `app/`.
2. Create Linear issues from [_bmad-output/implementation-artifacts/todo-app-dry-run.md](/Users/raedmund/Projects/bmad+symphony/_bmad-output/implementation-artifacts/todo-app-dry-run.md).
3. Run Symphony externally with this repo's [WORKFLOW.md](/Users/raedmund/Projects/bmad+symphony/WORKFLOW.md).
4. Verify that Symphony clones this repo into a workspace, executes one issue, and stops at `In Review`.

## Run the app locally

Because the app is static HTML, the simplest local run is:

```bash
cd app
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).
