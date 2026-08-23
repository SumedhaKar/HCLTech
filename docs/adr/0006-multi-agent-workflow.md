# 0006. Multi-agent build workflow (OCT / FE / BE / INT)

Status: Accepted
Date: 2026-08-22

## Context
Solo developer wanted build throughput closer to a small team's, without literally recruiting one. The available mechanism is Claude Code's built-in subagent system: an orchestrating session (OCT) can dispatch parallel background subagents that work independently and report back, rather than requiring separate manually-managed terminal windows.

## Decision
- **OCT** (the main session) dispatches one **FE** and one **BE** subagent per slice, each on its own branch (`feat/fe-<slice>`, `feat/be-<slice>`), each opening a PR when its half of the slice is done.
- Slice 0 (contract + scaffold) is done by OCT directly, not dispatched in parallel — FE and BE can't meaningfully fork without an agreed API contract to build against first.
- Once both PRs for a slice exist, OCT dispatches an **INT** subagent on `test/int-<slice>` to run automated tests and verify the FE↔BE integration end-to-end (env vars, CORS, API base URLs) — not just unit-level correctness in isolation.
- On INT pass, **OCT auto-merges** — standing authorization, granted explicitly, not re-asked per PR (see CLAUDE.md "Hard rules"). On failure, the specific failure routes back to whichever agent (FE or BE) owns it for a fix-up round, then INT re-runs.
- Checkpoint to the author happens once per slice (after merge), not mid-slice.

## Consequences
- Throughput gain depends on slices being genuinely parallelizable — this only works because Slice 0 front-loads the API contract; any future slice that skips a contract step will just serialize FE behind BE (or vice versa) despite nominally running "in parallel."
- Auto-merge means AI-authored code lands in the submission's history without a per-PR human read — acceptable here because it's a solo private repo and the rule is recorded durably in CLAUDE.md, not because the risk is zero.
