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
