# Architecture Decision Records

One file per significant decision: `NNNN-short-title.md`, numbered sequentially, never renumbered or deleted after acceptance (a superseded decision gets a new ADR that supersedes it, status updated on the old one).

A decision earns an ADR when reversing it later would be expensive — choice of stack, data model shape, how the recommendation engine works, how auth/deployment is handled. Day-to-day implementation calls don't need one; the `.scratch` file in the repo root is for those and for anything still being worked out.

## Template

```
# NNNN. Title

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
What prompted this decision — the constraint, question, or tradeoff.

## Decision
What was decided, stated plainly.

## Consequences
What this makes easier, what it makes harder, what it forecloses.
```
