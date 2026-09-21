# Issues

Defects and known-deferred work. Ideas live in `FEATURES-BACKLOG.md` (not yet
needed); the build sequence lives in `BUILD_PLAN.md`.

## Open

### ISSUE-004 · Release gate suite — what is still not covered
**Found** 2026-09-19, updated 2026-09-21. **Visible:** no — latent. One
`npm run test:release` now chains lint, build, 191 unit tests, the mobile
(52), advisor/matrix (49), viewport (92) and white-glove sweeps and the
axe-core suite (44 tests; WCAG 2.0/2.1/2.2 A+AA, zero rule exclusions; desktop
and iPhone 13, both themes; every route, three decision details, the landing,
every orientation beat, the More sheet, the Advisor wizard). STILL NOT COVERED:
there is no end-to-end walk of the two signature workflows as a user performs
them on the workstation (the advisor/matrix sweep walks the Advisor on the
phone only); and the white-glove sweep probes each control from a fresh load,
so a control that only matters after another change (a Reset after an edit)
is proven wired by unit state, not by the sweep.

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

- 2026-09-21 · **What the new gates found on their first run** (axe: 4
  failures; white-glove: 31 findings, 15 once its own false positives were
  fixed). (1) Muted ink inside Fabric's always-dark face rendered at
  2.1–3.0:1 in the light theme — three texts reported, 67 rules use the token,
  so the token is re-mapped inside `.panel-face` once rather than patching
  three selectors. (2) A not-reached stage was dimmed with `opacity: .5`,
  halving already-muted text; it is marked by its dashed panel and its own
  words now. (3) The heading outline skipped levels (h2→h4 on the detail,
  h1→h4 in the phone story, h1→h3 on Policies): bare `<h4>` styled by element
  selector became a `.face-subheading` class on the right level. (4) **A real
  reload:** the phone story's "Open the desktop layout" called
  `location.assign`; it now puts the decision on the workstation route and
  switches the shell in place. The sweep first reported EVERY such button as a
  reload because it inferred one from a lost window global; it now listens for
  the page's `load` event, which is how the one real case was told from the
  false ones. (5) Dead-at-rest controls: three Reset buttons did nothing until
  something had changed (now `disabled` until then), and a matrix preset whose
  settings were already in force looked unpressed (one `presetIsActive` rule,
  workstation and phone).

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
