# Linear State Map

This repository uses a deliberately small Linear state machine for Symphony.

## Active contract

| Linear state | Dispatchable by Symphony | Meaning | Notes |
| ---- | ------- | ------- | ------- |
| Backlog | No | not ready for unattended work | human planning only |
| Todo | Yes | queued execution work | must already have clear scope and validation |
| In Progress | Yes | active execution underway | normal running state |
| In Review | No | waiting for a person to review the completed run | Symphony must stop dispatching here |
| Done | No | completed | terminal |
| Closed | No | completed or administratively closed | terminal |
| Cancelled / Canceled | No | intentionally stopped | terminal |
| Duplicate | No | superseded elsewhere | terminal |

## Default lifecycle

```text
Backlog -> Todo -> In Progress -> In Review -> Done
                        ^             |
                        |             v
                  back to In Progress
```

## Why `In Review` is non-active

The Symphony runtime is a scheduler and runner, not the final authority on acceptance. Once validation is complete, the run should hand off to a person. Keeping `In Review` outside `tracker.active_states` prevents accidental re-dispatch while the reviewer is still deciding.

## Why `Merging` is not enabled yet

The upstream Symphony reference workflow includes an optional `Merging` state for automated landing. This repo does not yet ship repo-local landing automation, so `Merging` is intentionally left out of [WORKFLOW.md](/Users/raedmund/Projects/bmad+symphony/WORKFLOW.md). If you add landing support later:

1. install the landing automation in-repo,
2. add `Merging` to `tracker.active_states`,
3. document the merge handoff policy here and in `WORKFLOW.md`.

## Dispatch checklist

Before moving an issue to `Todo`, confirm:

1. the issue points to one BMAD-defined unit of work,
2. the acceptance criteria are explicit,
3. the validation path is practical for an unattended run,
4. the task does not require starting a new planning phase.
