# BCSTANDARDS — janus-showcase

> AI agents: read this before writing code. This is the AI Context Contract for this repo.

## Governance

- Authority: **Blurred Concepts Engineering Constitution v2.0**. Precedence:
  direct owner instruction → this file → Constitution → topic standards.
- **Product class:** `P` (public showcase, mock data, no tenants, no billing).
- The demo standard is `portofolio-hub/docs/DEMO_POLISH_CHECKLIST.md` (§9 janus
  brief). Walk it; a defect rescan is not the walk.

## Cockpit, not engine (non-negotiable)

- Frontend only. Mock data. No backend code, no network calls, no secrets.
- `src/domain/` derives from the engine's **published protocol tables and
  policy records**. Never copy engine source into this repo.
- This repo is PRIVATE until the reveal (2026-09-24 12:00 ET), then public.

## Sealed names

Other systems reveal on their own dates. In this repo — code, docs, commit
messages, fixtures — until **after 2026-10-01**:

- say **"code-graph"** or "development-time comprehension", never the Oct 1
  system's name;
- say **"operational memory"**, never that memory system's product name;
- do not mention any package registry, distribution name or install command
  for the engine.

Aether SDK is revealed and may be named.

## Claims discipline

- Derived, never asserted: every figure in a view comes from one module; the
  matrix, evaluation and fabric gates in `tests/` pin the domain.
- Never: "the AI decides", "autonomous agent", a confidence number other than a
  model candidate against `minimum_model_confidence`.
- Never claim continuations carry expiry, single-use or replay protection.
- Never show Janus persisting anything. History belongs to the composed runtime.

## Git

Solo-maintained: commits land on `main`, which auto-deploys once connected.
Conventional commits. Run `npm run test:unit` (later `test:release`) first.
