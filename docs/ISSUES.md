# Issues

Defects and known-deferred work. Ideas live in `FEATURES-BACKLOG.md` (not yet
needed); the build sequence lives in `BUILD_PLAN.md`.

## Open

### ISSUE-001 · Phones: two tables scroll sideways inside their panels
**Found** 2026-09-19, runtime walk at 375px. **Visible:** yes, on phones.
The outcome-matrix table (`.matrix-mini-table`, used by the Matrix view, the
Advisor view and the decision-detail rail) and the policy diff table
(`.policy-diff__table`) are wider than a 375px viewport and scroll inside
their own containers. The page itself does not scroll sideways (measured:
`scrollWidth === innerWidth` on all six surfaces). Nested sideways scroll is
forbidden by the mobile sweep. **Fix:** matrix rows become stacked cards on
phones with the fired row first; Policies diff is workstation-only
(`DESK_ONLY_VIEWS`) with `?view=desktop` as the escape hatch.

### ISSUE-002 · Phones: no companion shell yet
**Found** 2026-09-19. **Visible:** yes, on phones. The sidebar stacks as a
284px-tall block above every view at 375px. The plan calls for bottom tabs
(Decisions · Advisor · Matrix), no footers, and authoring controls
("Re-run with…", Policies draft/diff) gated to workstations.

### ISSUE-003 · No landing gate, no onboarding
**Found** 2026-09-19. **Visible:** yes. The app opens straight into the
ledger. Plan: a `sessionStorage`-scoped landing stating "mock data · the
engine is private", and a four-beat orientation (one request → one directive
→ the boundary → the ticket). Sign-out must clear the flag.

### ISSUE-004 · Release gate suite not ported
**Found** 2026-09-19. **Visible:** no — latent. Only `test:unit`, `lint` and
`build` exist. Still to port from the reference showcase: axe-core WCAG A/AA
e2e at desktop and phone (zero exclusions), the white-glove, mobile and
viewport sweeps, the data-coherence gate, `capture-og.mjs`, and a
`test:release` chain. Colour-token contrast has NOT been measured yet — the
tokens were chosen to pass AA by eye, which is not evidence.

### ISSUE-005 · Decision-detail rail not visually reviewed
**Found** 2026-09-19. **Visible:** unknown. Screenshots of the detail view
timed out in the review session, so the three-row rail was verified by DOM
measurement only (no element past the viewport at 1440px or 375px; stage
numbering via CSS counters present). It needs a human or screenshot look.

## Closed

- 2026-09-19 · **Detail rail widened the page to 2,106px at 1,440px.** Eight
  stages in one non-wrapping row. Now three rows of two around a horizontal
  boundary (`c65fd5f`).
- 2026-09-19 · **Decisions table was 1,972px wide inside a scrolling panel,
  hiding the Fabric-result column.** Three causes, in order found: eight
  nowrap columns; a `width: 100%` cell (in auto table layout that makes the
  table as wide as itself plus every other column); and a specificity bug —
  `.decisions-table td { white-space: nowrap }` beat the single-class
  title-cell rule, so the title never wrapped. Now six columns, identifiers on
  a wrapping meta line, only When / Directive / Matrix row held to one line.
- 2026-09-19 · **"Authority required: —" on rejections.** Now read from the
  action policy the directive references, not from the (absent) ticket.
- 2026-09-19 · **Raw enum model statuses shown to users.** One label map in
  `src/utils/format.js`; protocol identifiers stay verbatim.
- 2026-09-19 · **Domain comment overstated continuation integrity** ("a forged
  one cannot validate"). The id is content-derived, not signed: an edited
  continuation fails its own id, a self-consistent one validates — safe,
  because a continuation grants nothing and every constraint is re-checked.
  Comment corrected; no UI copy made the claim.
- 2026-09-19 · **Tamper message asserted "the model was never touched"
  unconditionally** beside a derived count rendered as "0 time(s)". The
  sentence is now conditional on the measured port-call count.
