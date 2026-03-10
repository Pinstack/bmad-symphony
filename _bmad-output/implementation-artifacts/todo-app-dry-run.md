# Todo App Dry Run

This document defines the first small project scope for proving that BMAD and Symphony work together in this repository.

## Goal

Build and iterate on a tiny browser-based todo app in this repo while using:

- BMAD artifacts for scope and execution context,
- Linear issues as dispatch units,
- Symphony as the external orchestrator,
- Codex as the execution engine inside isolated workspaces.

## Initial product slice

The baseline app lives in `app/` and currently supports:

1. adding tasks,
2. persisting tasks to `localStorage`,
3. toggling task completion,
4. deleting individual tasks,
5. clearing completed tasks.

## Suggested first Linear issues

### Issue 1: Polish the todo composer

**Context**

- Source files: `app/index.html`, `app/styles.css`, `app/app.js`
- User-visible change in the existing todo app

**Acceptance Criteria**

- adding a task with the Enter key works consistently,
- empty tasks are rejected gracefully,
- the input regains focus after submission.

**Validation**

- open `app/index.html` in a browser,
- add a task with the keyboard only,
- confirm focus returns to the input after submit.

### Issue 2: Add task filtering

**Context**

- Source files: `app/index.html`, `app/styles.css`, `app/app.js`
- Extend the baseline todo app

**Acceptance Criteria**

- the UI supports `All`, `Open`, and `Completed` filters,
- the current filter updates the rendered list without mutating stored task data,
- counts stay accurate while filters change.

**Validation**

- create open and completed tasks,
- switch between filters,
- verify the counts and visible tasks stay correct.

### Issue 3: Add lightweight test coverage

**Context**

- Add the smallest practical test setup for this static app

**Acceptance Criteria**

- the project gains one reproducible automated test path,
- at least one core todo behavior is covered,
- the test instructions are documented in `README.md`.

**Validation**

- run the documented test command,
- confirm it passes from a clean clone.

## Dry-run success criteria

The dry run is successful when:

1. Symphony clones this repo into a workspace,
2. one Linear issue tied to this document is executed,
3. the change is validated,
4. the issue stops at `Human Review`.
