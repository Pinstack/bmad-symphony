#!/bin/sh

set -eu

log() {
  printf '[after_create] %s\n' "$*"
}

fail() {
  printf '[after_create] ERROR: %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

need_file() {
  [ -f "$1" ] || fail "missing required file: $1"
}

need_cmd git
need_cmd pwd
need_cmd codex

workspace_root=$(pwd)

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "workspace is not a git checkout. Ensure hooks.after_create clones the source repo before invoking this script."

repo_root=$(git rev-parse --show-toplevel 2>/dev/null || true)
[ -n "$repo_root" ] || fail "could not determine the git repository root"
[ "$repo_root" = "$workspace_root" ] || fail "run this script from the workspace root ($repo_root), not $workspace_root"

origin_url=$(git remote get-url origin 2>/dev/null || true)
[ -n "$origin_url" ] || fail "git remote 'origin' is not configured. Set SYMPHONY_SOURCE_REPO_URL to a cloneable Git URL or local path."

[ -n "${LINEAR_API_KEY:-}" ] || fail "LINEAR_API_KEY is not set. Symphony cannot poll Linear without it."

need_file "WORKFLOW.md"
need_file "_bmad/bmm/config.yaml"
need_file "docs/symphony-bmad-integration.md"
need_file "docs/linear-state-map.md"

mkdir -p .symphony

if [ -n "${SYMPHONY_SOURCE_REF:-}" ]; then
  log "workspace cloned from $origin_url (requested ref: $SYMPHONY_SOURCE_REF)"
else
  log "workspace cloned from $origin_url"
fi

{
  printf 'workspace=%s\n' "$workspace_root"
  printf 'origin=%s\n' "$origin_url"
  printf 'head=%s\n' "$(git rev-parse --short HEAD 2>/dev/null || printf 'unknown')"
  printf 'workflow=%s\n' "WORKFLOW.md"
} > .symphony/bootstrap-context.txt

if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null || true)" ]; then
  log "workspace has tracked modifications before execution starts."
else
  log "workspace checkout is clean."
fi

log "bootstrap checks passed."
