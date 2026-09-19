# Janus — cockpit demo

> **Janus decides. Fabric acts.**

Janus is a policy-bound decision engine for agentic systems. It evaluates one
complete request — a persona, an event and state — against versioned policy
records and emits **exactly one directive**: `ADVISE`, `ACTIVATE_SHARD` or
`REQUEST_INPUT`. It executes nothing, issues no tickets and grants no
authority. A separate execution fabric validates the trusted caller, derives a
least-authority ticket and records the outcome. A model can take part only
through a bounded advisory port: it may classify and advise, and it can never
choose the shard, the action or the inputs.

This repository is the **cockpit**: a frontend-only operator console on mock
data that makes that contract visible. The engine is private and is not here.

## What's real vs. illustrative

| Surface | Status |
|---|---|
| The three directives, the eleven-row outcome matrix, fail-closed pre-matrix checks, the actionless advisor, stateless caller-held continuations | **Real** — the engine's published protocol. `src/domain/` is a small JavaScript derivation of that protocol's tables and rules, pinned by the unit gates in `tests/`. It is not the engine's source. |
| The two persona policies and one action policy | **Real** — the engine's canonical policy records. |
| Ticket derivation and the closed rejection-code list | **Real contract, fabric-owned** — shown because the governed path crosses the boundary; Janus itself never does this. |
| The operator console itself (ledger, traces, explorer) | **Illustrative** — the engine is a library with no UI and stores nothing. History shown here is what a composed runtime would hold (fabric outcomes), never Janus state. |
| Tenants, callers, leads, advice text, timestamps | **Fictional** mock data, anchored to today. |
| Model responses | **Scripted.** No model or provider adapter ships with the engine, and none runs here. |

## Run

```bash
npm install
npm run dev
npm run test:unit
```

## Gates

`npm run test:unit` runs the matrix gate (every protocol row, plus totality),
the evaluation gate (fail-closed before any model call; the model never widens
policy) and the fabric gate (exact policy scopes, exact correlation, no ticket
on rejection).
