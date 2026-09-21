# Issues

Defects and known-deferred work. Ideas live in `FEATURES-BACKLOG.md` (not yet
needed); the build sequence lives in `BUILD_PLAN.md`.

## Open

### ISSUE-003 · No landing gate, no onboarding
**Found** 2026-09-19. **Visible:** yes, on both surfaces. The app opens
straight into the ledger (desktop) or Attention (phone). Plan: a
`sessionStorage`-scoped landing stating "mock data · the engine is private",
and a four-beat orientation (one request → one directive → the boundary → the
ticket), designed separately for the phone. Sign-out must clear the flag. The
mobile sweep carries this as its one PENDING line (point 8, the tour's first
spotlight).

### ISSUE-004 · Release gate suite only partly ported
**Found** 2026-09-19, updated 2026-09-21. **Visible:** no — latent. In place:
`test:unit` (158), `lint`, `build`, `test:sweep:mobile` (47 checks + a
`--self-test` proving it fails a forced desktop layout),
`test:sweep:advisor-matrix` (49 checks, same self-test), a WCAG contrast test
over the tokens for both themes, a colour-literal / gradient gate, an
orphan-class gate and a scroll-container gate. STILL MISSING: axe-core WCAG
A/AA e2e on rendered pages at desktop and phone (the contrast test covers
token PAIRS, not what is actually rendered), the white-glove sweep (text
defects + inert affordances), the viewport sweep, the data-coherence gate,
`capture-og.mjs`, and one `test:release` that chains all of it — today the two
phone sweeps are separate scripts and `test:release` runs only the first.

### ISSUE-006 · Tablet (768–1023px) has not been looked at
**Found** 2026-09-21. **Visible:** unknown. The companion shell serves
everything under 1024px and the feeds go two-column at 768px, but no tablet
screen has been captured or reviewed, and neither sweep runs at a tablet
viewport. The dreamcatcher cycle found four tablet-landscape bugs only after
its reveal; do this before T-1.

### ISSUE-007 · The desktop forced onto a phone is unusable by design, but says nothing
**Found** 2026-09-21. **Visible:** only after tapping "Open the desktop
layout" on a phone. The escape hatch renders the full desktop shell in a
phone viewport (that is what it is for), with a "Back to the phone layout"
link in the topbar. It has not been checked that the link is reachable
without sideways scrolling at 375px.
## Closed

- 2026-09-21 · **ISSUE-001 · two tables scrolled sideways on phones.** No
  `<table>` renders on the companion at all now: the matrix is a lookup with
  rows as cards (fired row first), the decision story shows only the fired
  row, and the Policies diff is a workstation surface with a designed
  desk-only state. Both sweeps assert "no table, no sideways scroller" on
  every phone screen and again after opening every `<details>`.
- 2026-09-21 · **ISSUE-002 · the phone was the desktop, stacked.** Owner:
  "why do you constantly force desktop layouts into a mobile ratio and call
  that mobile-ready". Measured then: content began 507px into a 664px screen,
  the page ran 4,239px, 16 of 27 touch targets were under 44px — and it had
  passed the only check that existed, an overflow detector any collapsed
  desktop passes. Now a separate companion shell (desktop chrome not mounted):
  compact app bar with the standing "Mock data" notice, fixed bottom tabs, a
  phone-only Attention home, a Decisions feed, the decision story as a
  collapsed stepper with full-bleed faces, a one-step-per-screen Advisor, a
  matrix lookup, and desk-only states. The mobile claim is made only by sweeps
  that a squeezed desktop FAILS (proved by `--self-test`).
- 2026-09-21 · **ISSUE-005 · detail rail never visually reviewed.** Reviewed
  from full-page captures in both themes once the scroll-container bug below
  was fixed.
- 2026-09-21 · **A bare deep link (`/?d=<id>`) showed the Attention list on a
  phone.** The story only opened under `view=decisions`; a bare link lands on
  the phone's default view. Found by opening one, not by the sweep (which
  tapped cards). Now a tested pure rule, and the sweep opens one in a fresh
  context.
- 2026-09-21 · **The story verdict said "Activated, but Fabric rejected…".**
  Nothing had been activated. A directive is never described as an activation:
  Janus directs; only Fabric's outcome says whether anything ran.
- 2026-09-21 · **The directive chip had no styles on ANY screen.** Its rules
  lived in a screen stylesheet that a parallel rewrite replaced. Now the shared
  `.chip` family; `tests/orphanClasses.test.js` fails on any class used in JSX
  with no rule (it also caught the "row N" tag).
- 2026-09-21 · **`<body>` was the scroll container.** A `height: 100%` chain
  plus an `overflow-x: hidden` guard: the document reported 900px for 1,876px
  of content, clipping every full-page capture. `tests/scrollContainer.test.js`.
- 2026-09-21 · **Dark theme: active toggle was white on white** (ink fill +
  ink-inverse text; a flaw in the token contract itself). Ink fills take
  canvas text; pinned in the contrast test.
- 2026-09-21 · **The faint ink token was used for real text** (nav group
  labels, stage numbers). Gate added.

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
