# Issues

Defects and known-deferred work. Ideas live in `FEATURES-BACKLOG.md` (not yet
needed); the build sequence lives in `BUILD_PLAN.md`.

## Open

### ISSUE-004 · Release gate suite only partly ported
**Found** 2026-09-19, updated 2026-09-21. **Visible:** no — latent. In place:
`test:unit` (164), `lint`, `build`, `test:sweep:mobile` (47 checks + a
`--self-test` proving it fails a forced desktop layout),
`test:sweep:advisor-matrix` (49 checks, same self-test), a WCAG contrast test
over the tokens for both themes, a colour-literal / gradient gate, an
orphan-class gate and a scroll-container gate. STILL MISSING: axe-core WCAG
A/AA e2e on rendered pages at desktop and phone (the contrast test covers
token PAIRS, not what is actually rendered), the white-glove sweep (text
defects + inert affordances), the data-coherence gate and `capture-og.mjs`.
`test:release` now chains lint, build, unit and all three sweeps (mobile,
advisor-matrix, viewport — 84 cell×screen checks).

### ISSUE-008 · Companion debt measured against the shared benchmark
**Found** 2026-09-21 by the five-showcase review
(`portofolio-hub/docs/MOBILE_COMPANION_BENCHMARK.md`). **Visible:** yes, minor.
(a) The desk-only states (Policies, Boundary) say why and offer the desktop,
but carry no live count of what is waiting at the desk — Ops's does. (b) The
viewport sweep checks shell, chrome, overflow and the way back in every cell,
but does NOT yet assert that a desk-only route stays desk-only in every cell
below the workstation tier — the exact defect found in Ops at 721–979px. Janus
has one breakpoint shared by JS and CSS, so it is believed absent, not proven.
(c) CLOSED 09-21 — the phone-sized first run exists (ISSUE-003).

## Closed

- 2026-09-21 · **ISSUE-003 · no landing gate, no onboarding.** Now a landing
  (the two faces side by side on a workstation, stacked and full-bleed on the
  companion; every id on Fabric's face read off the anchor ledger entry) and a
  four-beat orientation — one request in, exactly one directive out, the
  boundary, the ticket — as a dialog on the workstation and one beat per
  screen on the phone, from ONE `beats.js` so the two can differ only in
  chrome. The landing flag is `sessionStorage`, the orientation flag
  `localStorage`; Skip and Escape count as done; "Replay the introduction"
  (top bar, More sheet) clears both. A deep link (`?view=`, `?d=`) bypasses
  the gate: a shared link's promise is the record, and the standing "Mock
  data" notice already carries the honesty line. The mobile sweep's pending
  check 8 is now four real checks on an unseeded context (52/52); the
  viewport sweep looks at the landing in every unforced cell (92/92).
  Reviewed from captures, then corrected: the workstation copy hugged the
  left edge of a 34rem face, a portrait tablet gave Fabric's face 70% of the
  screen, beat 2 said the model "classifies", and beat 4's figure was a bare
  bullet — it now shows what the caller holds beside what the ticket carries.

- 2026-09-21 · **ISSUE-006 · tablet had not been looked at.** Owner: "portrait
  and landscape on both mobile and tablet need to be verified as well as full
  desktop views on both". `scripts/viewport-sweep.mjs` now runs iPhone 13, iPad
  Mini and iPad Pro 11 in portrait and landscape, each with the layout the app
  chooses and with the desktop forced, plus 1280 and 1440 desktops — 12 cells ×
  7 screens, a first-screen PNG per cell in `media/viewport/`. First run failed
  45 of 84: fixed bars took 185px of a 342px landscape phone (tabs now move to
  a side rail under 500px tall), and the ledger overflowed a landscape tablet
  (columns fold at ≤1359px and ≤1100px).
- 2026-09-21 · **ISSUE-007 · the desktop forced onto a phone.** It rendered
  desktop components at 390px. It is now the real desktop laid out at 1280px
  through the viewport meta and scaled to the screen, judged by DEVICE width
  so the "Back to the phone layout" link stays visible; the sweep fails a
  forced cell that lays out under 1024px or hides the way back. (Finance
  Freedom had the viewport-meta technique first, `main.jsx`.)

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
