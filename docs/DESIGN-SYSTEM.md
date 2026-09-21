# Design system — Janus cockpit

> Binding for every stylesheet and component. Chosen 2026-09-19 after a review
> of the five released showcases. The first build shipped Tailwind's stock
> slate-900 + indigo-400 "AI dashboard" look because no design language was
> briefed; this document is that brief.

## Family: the Aether SDK console language

Janus and Aether SDK are siblings in one runtime (Janus decides; the `lead.crm`
shard executes through Aether), and they share an audience: platform and
AI-infrastructure engineers. Janus adopts the Aether console language —
clinical off-white canvas, white hairline cards, a near-black operational
panel, ONE sparing accent, status colours independent of brand, Hanken Grotesk
for interface text, JetBrains Mono for identifiers. Hairlines structure the
page; shadows exist only on floating layers.

Two things are Janus's own.

### 1 · The two faces (the signature device)

Aether contrasts a light canvas with a near-black panel. In Janus that contrast
IS the product's claim — *Janus decides. Fabric acts.*

- **Janus's side of any path renders on the light side**: `--color-surface`
  cards on `--color-canvas`. Requests, pre-matrix checks, the outcome matrix,
  policy records, the directive — deliberation reads as documents.
- **Fabric's side renders on `--color-panel`** (near-black) with
  `--color-ink-inverse` text and `--color-panel-border` rules: trusted caller,
  ticket or rejection, outcome. Execution reads as an operational console.
- **The boundary is the seam between the two surfaces**: a full-width band
  where the canvas ends and the panel begins, carrying the label
  `JANUS DECIDES · FABRIC ACTS` in mono uppercase and a 3px
  `--color-accent` rule. No dashed line, no gradient, no icon.
- When nothing crosses (`ADVISE`, `REQUEST_INPUT`), the panel is still drawn,
  visibly empty, with one sentence. The absence is the point.
- Canonical JSON (directive, continuation, ticket) always renders in a
  `--color-panel` block regardless of which side it sits on or which theme is
  active — payloads are the contract, and the contract looks the same
  everywhere. This is the one place the dark panel appears on Janus's side.
- The dark theme keeps the device: Janus's side on `--color-surface`
  (`#16181d`), Fabric's side on `--color-panel` (`#090a0c`), seam rule in
  accent.

### 2 · Brass, not lime (and never violet)

The Roman bronze *as* carried Janus's two-faced head. The accent is brass.
It follows Aether's rule exactly: **the accent is a fill or a rule with dark
ink on it — never text, never a wash, never a gradient.** It marks where the
operator acts and what fired: primary button, active nav marker, the fired
matrix row's marker, the seam rule, focus ring.

## Tokens (`src/styles/tokens.css` is the ONLY file that may contain a colour literal)

Light (`:root`, the default):

| Token | Value | Note |
|---|---|---|
| `--color-canvas` | `#f8f8f6` | page |
| `--color-surface` | `#ffffff` | cards |
| `--color-surface-muted` | `#f1f1ee` | table head, inset |
| `--color-surface-hover` | `#f4f4f1` | |
| `--color-panel` | `#15171c` | Fabric side, payload blocks |
| `--color-panel-raised` | `#1e2128` | cards inside the panel |
| `--color-panel-border` | `#2b2e35` | |
| `--color-panel-muted` | `#a3a7af` | secondary text ON the panel |
| `--color-ink` | `#15171c` | |
| `--color-ink-muted` | `#5f636b` | secondary text — AA on canvas AND surface-muted |
| `--color-ink-faint` | `#b3b6bd` | **decorative only — never text** |
| `--color-ink-inverse` | `#f8f8f6` | text on panel |
| `--color-accent` | `#c9a227` | brass FILL |
| `--color-accent-strong` | `#b38f1d` | fill hover |
| `--color-accent-soft` | `#f7efd3` | selected-row tint |
| `--color-accent-ink` | `#15171c` | text on accent fill |
| `--color-accent-line` | `#8a6d10` | bars, rules, focus ring on LIGHT surfaces (≥3:1) |
| `--color-border` | `#e6e7e3` | |
| `--color-border-strong` | `#d4d6d0` | |
| `--color-positive` / `-soft` / `-text` | `#1f9d57` / `#e7f6ec` / `#15713f` | |
| `--color-warning` / `-soft` / `-text` | `#b4530a` / `#fdeadb` / `#8f4108` | burnt orange — must not read as brass |
| `--color-danger` / `-soft` / `-text` | `#d6453b` / `#fceae8` / `#a82e26` | |
| `--color-info` / `-soft` / `-text` | `#2f6ae0` / `#e8effc` / `#2353b5` | |
| `--color-neutral` / `-soft` / `-text` | `#5f636b` / `#f1f1ee` / `#3f434a` | |

Dark (`[data-theme="dark"]`): canvas `#0f1013`, surface `#16181d`,
surface-muted `#1d2026`, surface-hover `#21242b`, panel `#090a0c`,
panel-raised `#121419`, panel-border `#24272e`, panel-muted `#9a9ea6`, ink
`#f2f3ef`, ink-muted `#a3a7af`, ink-faint `#6b6f77` (decorative only),
ink-inverse `#f2f3ef` (text on the panel stays light in dark theme), accent
`#d9b53a`, accent-strong `#e6c453`, accent-soft `#33290c`, accent-ink
`#15171c`, accent-line `#d9b53a`, border `#24272e`, border-strong `#33363e`.
Status in dark — soft / text: positive `#10301d` / `#5fd39a`, warning
`#3a2208` / `#f0a35e`, danger `#3a1512` / `#f2867d`, info `#14213a` /
`#8ab4f8`, neutral `#22252b` / `#c4c7cd`.

**Inverse pairing rule.** `--color-ink-inverse` means "text on the panel" and is
light in BOTH themes. It is never paired with an `--color-ink` background (ink
flips per theme, so that pair is white-on-white in dark). An ink-filled control
— the active segmented button — takes `--color-canvas` text. Gate:
`tests/contrast.test.js` asserts canvas-on-ink ≥ 4.5 in both themes.

`*-text` tokens exist because a status hue that passes as a fill does not pass
as small text. Chips use `-soft` background + `-text` foreground + a 1px
border at 35% of `-text`. Values above are starting points: **the axe gate is
the authority** — if a pair fails, change the token, never exclude the rule.

Type: `--font-sans: "Hanken Grotesk", system-ui, sans-serif`;
`--font-mono: "JetBrains Mono", ui-monospace, monospace`. Self-hosted variable
woff2 under `public/fonts/` with their OFL licence files (copy from the Aether
showcase). Scale `--text-xs 0.6875rem · sm 0.75 · base 0.8125 · md 0.875 ·
lg 1 · xl 1.3125 · 2xl 1.625 · 3xl 2`. Base size `--text-md`. Headings: sans,
600, letter-spacing `-0.02em` (xl) to `-0.04em` (3xl). **No serif anywhere.**

Mono is for the contract: policy ids, event types, directive types, rejection
codes, scopes, ids, JSON, matrix cells, timestamps, and every eyebrow / table
head (uppercase, `letter-spacing: 0.08em`, `--text-xs`). Numbers use
`font-variant-numeric: tabular-nums`.

Space `--space-1..6` = 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 rem. Radius
`--radius-xs 0.3125rem · sm 0.5 · md 0.625 · lg 0.875` — cards `md`, controls
`sm`, chips `xs`. **No radius above `lg`, no pill-shaped cards.** Shadows:
`--shadow-sm` on cards at most; `--shadow-float` for overlays only.
`--row-height 2.75rem`, `--control-height 2.25rem`, `--page-gutter 1.5rem`;
`[data-density="dense"]` tightens them (2.25 / 2 / 1) and is user-toggleable.

## Components

- **Shell** — left sidebar `14.75rem` on `--color-surface` with a right
  hairline; grouped nav with mono uppercase group labels (DECIDE: Decisions,
  Advisor · UNDERSTAND: Outcome matrix, Policies, Boundary). Active item =
  `--color-surface-muted` fill, ink text at 600, and a 3px
  `--color-accent-line` bar on the left edge. Sticky topbar on canvas with a
  bottom hairline: page eyebrow + title left; "Mock data · engine is private"
  tag, density toggle and theme toggle right. Wordmark: `Janus` in sans 700
  with a small two-tone square glyph (half `--color-surface` bordered, half
  `--color-panel`) — the two faces, drawn with two rectangles. No other logo.
- **Page heading** — mono eyebrow, `--text-2xl` title, one-sentence lede in
  `--color-ink-muted`, actions right.
- **Card** — surface, 1px border, radius md, shadow-sm. Card header = mono
  eyebrow + optional count, hairline beneath.
- **Data table** — collapsed borders, head row on `--color-surface-muted` in
  mono uppercase xs, rows `--row-height` with hairline dividers, hover
  `--color-surface-hover`, selected = `--color-accent-soft` + 3px
  `--color-accent-line` inset bar. Identifiers in mono.
- **Directive chip** — the three directives are the product's vocabulary and
  get fixed semantics: `ACTIVATE_SHARD` positive, `REQUEST_INPUT` warning,
  `ADVISE` neutral (NOT info-blue: advice is the absence of action). Mono,
  verbatim protocol spelling, leading icon, never colour alone.
- **Status chip / dot** — positive, warning, danger, info, neutral only.
- **Stage rail** (the governed path) — Aether's run rail, adapted: each stage
  is a column with a 3px top rule coloured by state — complete `positive`,
  failed `danger`, not reached `border` with `ink-muted` text — a mono
  two-digit index, a sans 600 title, a mono status line. The rail header runs
  the full width on the light side; the rail CONTINUES across the seam onto
  the panel, where unreached stages use `--color-panel-border`.
- **Identity chain** (correlation strip) — Aether's identity chain: mono
  uppercase label over a `code` value per id, joined by `→`, with an equality
  mark computed from the values. Pending ids in `ink-faint` + "not issued".
- **Payload block** — `pre` on `--color-panel`, `--color-ink-inverse`,
  `--text-xs`, radius sm, a mono uppercase caption above it naming the
  document type (`DirectiveV2`, `DecisionContinuationV2`, `TicketV2`).
- **Trace list** (pre-matrix checks) — one row per check: state icon, check
  name in sans 600, the engine's detail string in mono muted. Failed row gets
  a 3px `danger` left bar; rows after it read "not reached".
- **Data state** — one shared component for empty / loading / error /
  not-applicable / desk-only: a 4px left mark (accent, danger, warning or
  neutral), title, one sentence, optional action.
- **Buttons** — primary = accent fill + accent-ink text; secondary = surface +
  border-strong; ghost = text only. Height `--control-height`. Focus ring =
  2px `--color-accent-line`, 2px offset, on every interactive element.
- **Form controls** — surface, border-strong, radius sm, mono for values that
  are protocol identifiers.

## The phone companion (a separate surface, not a breakpoint)

> Owner, 2026-09-21: "why do you constantly force desktop layouts into a mobile
> ratio and call that mobile-ready". The first phone view was the desktop
> chrome stacked: toolbar, toggles and the whole sidebar filled the first
> screen, content began 507px into a 664px viewport, the page ran 4,239px, and
> 16 of 27 touch targets were under 44px. It passed the only check that
> existed — "nothing is wider than the viewport" — which any desktop layout
> that collapses to one column passes. That check is a FLOOR. It is never
> evidence of a mobile design and must never be reported as one.

**Start from the person, not the layout.** On a phone, someone responsible for
this runtime does three things: sees what needs attention, reads the story of
one decision, and walks the Advisor. They do not author policies, re-run a
request against a different caller, or study an eleven-row table. The phone
gets its own screens for those three jobs; everything else is a workstation
surface and says so.

Below 1024px (unless `?view=desktop`) the app renders the COMPANION SHELL —
different components, not the desktop ones restyled:

- **No sidebar. No desktop topbar.** A compact app bar (≤ 52px): the two-tone
  glyph, the current screen's title, and the standing **"Mock data"** notice
  (the desktop always shows it; the phone must too). No menu button on the
  bar — the More tab owns that sheet, and two entry points to one sheet is
  noise. Theme, density and "Open the desktop layout" live in the More sheet.
- The active tab is ink at 600 under a 3px brass bar. The accent is never
  text, on any surface.
- **Bottom tab bar**, fixed, safe-area padded, four tabs with icon + label,
  every target ≥ 44×44: **Attention · Decisions · Advisor · More**. The tab bar
  owns the floor: no footer, nothing fixed above it except a screen's own
  primary action.
- **Attention** (phone-only, the home tab) — what needs a human: decisions
  Fabric rejected, requests that failed closed before the matrix, requests
  waiting on input. A derived header ("N of M need attention"), then cards
  grouped by reason. Each card carries exactly: directive chip, title, one
  mono line (policy ref · event), relative time, and THE reason in one line —
  the verbatim rejection code, the failed check's name, or the requested
  fields. When nothing needs attention the screen says so plainly. The
  grouping is one pure function over the ledger, unit-tested.
- **Decisions** — a feed of cards, newest first. Never a table on a phone.
  The directive filter is a native `<select>`, never a scrolling pill strip.
- **The decision story** (phone detail) — not the desktop page stacked. A
  vertical stepper of the six stages with a left rule coloured by state and
  each stage collapsed to its ONE derived status line; the stage that explains
  the outcome (the failed check, the rejection, or the directive) is open by
  default, the rest are `<details>`. A sticky mini-header keeps the title and
  directive chip in view. **The two faces go full-bleed**: stages 01–04 on the
  canvas, the seam as an edge-to-edge band, stages 05–06 on an edge-to-edge
  dark panel — no cards nested in cards. Payload JSON sits behind
  "Show DirectiveV2" / "Show TicketV2". No re-run controls: one line and a
  link to the desktop layout.
- **Advisor** — one step per screen, in order, with "Step N of 5" derived from
  the walk state and the step's primary action pinned above the tab bar. The
  continuation's "what it does not carry" list is the content of its own
  step. Tamper controls stay behind "Advanced".
- **More** — a sheet: Outcome matrix (as a LOOKUP: three native selects and
  the checkbox → one result card; "all rows" as cards, fired row first),
  theme, density, "Open the desktop layout", and the two workstation surfaces
  (Policies, Boundary) listed with a "workstation" tag.
- **Workstation-only**: Policies, Boundary, and every "Re-run with…" control.
  Reaching one on a phone renders the desk-only state (shared `DataState`,
  neutral): what it is, why it is a workstation surface, a link that switches
  to `?view=desktop`, and a link back. `?view=desktop` persists for the
  session and a "Back to the phone layout" link clears it.
- 768–1023px is the companion shell with a two-column feed; ≥ 1024px is the
  desktop shell.
- No hover-only affordance. Every interactive target ≥ 44×44 CSS px. Body text
  ≥ 15px, mono identifiers ≥ 13px, and an identifier never truncates — it
  wraps.

**The gate that replaces the overflow check as the mobile claim**
(`scripts/mobile-sweep.mjs`, run on an emulated phone against the built app;
a squeezed desktop layout must FAIL it):

1. The desktop sidebar and desktop topbar are not rendered.
2. The bottom tab bar is visible, fixed to the viewport bottom, and every tab
   is ≥ 44×44.
3. On every tab, the first real content (a card, a step, a result) starts in
   the top 35% of the first screen.
4. Every visible interactive target is ≥ 44×44 (an explicit, reviewed
   allowlist for inline text links only).
5. No `<table>` is rendered. No element is wider than the viewport. No
   element scrolls sideways. The document is the only vertical scroller.
6. The collapsed decision story is ≤ 3.5 viewports long; the Attention and
   Decisions screens show at least two cards in the first screen.
7. Each workstation-only route renders the desk-only state, and its link
   reaches the desktop shell.
8. The tour/onboarding's first spotlight lands on a visible phone element.

Until that sweep exists and passes, nothing — commit message, status note or
report — may describe the phone experience as ready, clean or done.

## Forbidden

Violet, indigo or purple in any role. Gradients. Glow, blur or glass effects.
Emoji. Rounded-full cards. Drop shadows on in-flow cards beyond `--shadow-sm`.
A colour literal outside `tokens.css` (gate: `tests/designTokens.test.js`).
Accent used as text or as a large background. `--color-ink-faint` as text.
Serif type. Centered hero layouts inside the app. Decorative icons that carry
no state.

## Themes and capture

Default theme is **light** — the two-faces device is strongest there and it
matches the sibling console. `[data-theme="dark"]` is a full theme, toggled in
the topbar, persisted in `sessionStorage`, and forced by `?theme=dark` (the
reveal wall's cards are dark, so the wall preview, OG card and teaser are
captured with `?theme=dark`; in-page case-study figures may be light).

## Entry: landing and orientation

ISSUE-003. Before ISSUE-003, the app opened straight into the ledger
(desktop) or Attention (phone) — no statement that this is mock data over a
private engine, and no orientation to the vocabulary (directive, boundary,
ticket) before the operator hits it cold.

**The gate** (`src/utils/entryGate.js`, unit-tested directly; wired to the DOM
by `src/hooks/useEntryGate.js`) resolves one of three stages:

- `landing` — not yet entered this session.
- `onboarding` — entered, but the four-beat orientation is unseen.
- `app` — the real thing.

Two flags carry it, in two different storages **on purpose**:
`sessionStorage['janus:entered'] = '1'` (the landing is a per-VISIT gate — a
new tab or a later session sees it again) and
`localStorage['janus:onboarded'] = 'done'` (the orientation is a per-BROWSER,
one-time thing — a reload or a new tab never re-nags once it has been seen or
skipped). Skip and Escape both write `done`; there is no partial-credit
state. These are a contract with the sweep scripts
(`scripts/mobile-sweep.mjs`, `scripts/sweep-advisor-matrix.mjs`,
`scripts/viewport-sweep.mjs`), which seed both flags via
`context.addInitScript` in every context except the ones deliberately
exercising the gate itself — do not rename either key or its value.

**A deep link always bypasses the gate** (`isDeepLink`: a `d` or a `view`
query param, any value, including the literal `desktop` layout switch) and
resolves straight to `app`, regardless of the flags. A shared or case-study
link's promise IS the record — a recipient who clicks `/?d=<id>` must see
that decision, not a splash screen — and the standing "Mock data · engine is
private" notice in the app bar/top bar already carries the honesty line on
every other screen, so nothing is lost by skipping the landing for it.

**The landing** (`src/views/LandingView.jsx`, `src/styles/landing.css`) is
one screen, no scrolling, at 1280×800 or at 390×664: the `Wordmark`, the H1
"Janus decides. Fabric acts.", the one-paragraph pitch, the honesty line as
visible text (never a tooltip), and one primary button, "Enter the console"
(ink fill, canvas text, ≥44px tall, autofocused). It carries the two-faces
device at hero scale — the one deliberate exception to "no centered hero
layouts" above, because the device itself is the content here, not
decoration. `useWorkstation().isWorkstation` (the same hook and breakpoint
the rest of the app uses — never a second breakpoint) picks between two
layouts, both built from the SAME markup order (copy first):

- **Workstation**: light face and dark face side by side, split by the one
  VERTICAL seam in the app (a left rule instead of a top one, the label read
  top-to-bottom) — every other use of the seam stacks Janus's side above
  Fabric's, but this is the only side-by-side use of the device.
- **Companion**: the same two faces stacked, seam horizontal as usual, the
  dark face full-bleed beneath the copy (left 0, right = viewport width).

The dark face shows a compact, panel-toned rendition of the anchor scenario's
identity chain (`LEDGER[0]`, `LandingIdentityStrip.jsx`) — request → directive
→ ticket → outcome, every value read off the real ledger entry, never typed.
It is its own small component rather than the shared `IdentityChain`, which
hardcodes light-canvas colours (every other use of it sits on Janus's side,
above the seam).

**The orientation** is four fixed beats — "One request in" · "Exactly one
directive out" · "The boundary" · "The ticket" — with their copy and one
small derived figure per beat defined ONCE
(`src/components/onboarding/beats.js`, `BeatFigure.jsx`) and shared by two
chrome-only presentations:

- **Desktop** (`OrientationDialog.jsx`): a centred modal, `role="dialog"
  aria-modal="true"`, max width ~560px — NOT a spotlight tour, because the
  four beats are self-contained content, not callouts pointing at live UI.
  Focus is trapped inside while open and restored to whatever had it on
  close; Escape finishes the tour, same as Skip. The app behind it is
  `inert` while it is open.
- **Phone** (`OrientationSteps.jsx`): its own FULL-SCREEN surface — it mounts
  INSTEAD of `CompanionShell`, not on top of it, so there is no app bar or
  bottom tab bar underneath it. One beat per screen, reusing the Advisor
  wizard's pinned action bar (`WizardActionBar`) for Next/Back; "Skip" is a
  separate ≥44×44 text button in the header, kept out of the pinned bar so it
  never sits where a thumb expects Back or Next. In a short landscape
  viewport the action bar un-pins with the rest of the companion's wizard
  chrome (`companion-landscape.css`).

Domain rules for the beats' copy: never "the AI decides", "autonomous agent",
a confidence number, a claim that continuations expire, are single-use or
have replay protection, a claim that Janus ships a model/provider adapter, or
"Activated" as a description of a directive.

**Replay.** "Replay the introduction" — a plain button beside the theme/
density toggles in the desktop `TopBar`, and a row in the phone `MoreSheet`
— clears both flags and strips `d`/`view` from the URL (`history.replaceState`,
so a stale deep link cannot immediately re-bypass the landing it just
returned to), landing back on the gate's own first stage.

**The mobile sweep's point 8** (`scripts/mobile-sweep.mjs`,
`runOnboardingChecks`) is the one context in that file that runs UNSEEDED —
every other context seeds past the gate. It checks: the landing's H1 in the
top 35% and its primary button ≥44×44 fully on the first screen (8a); after
entering, the phone orientation is its own full-screen surface with no
desktop dialog present and its step heading in the top 35% (8b); stepping
through all four beats lands in the app with the bottom tabs visible, and a
reload never re-shows the landing or the orientation (8c); and Replay from
More returns to the landing (8d). `scripts/viewport-sweep.mjs` adds a
`landing` screen, judged by the same overflow/chrome/first-content floor
every other screen uses, on its own unseeded context per cell — forced-
desktop cells skip it, because a deep link always bypasses the gate and the
landing has no forced-desktop mode to differ by.
