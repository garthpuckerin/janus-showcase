# Build plan — cockpit UI (T-5 → T-3, Sep 19–22)

Domain core is done and gated (`src/domain/{matrix,policies,evaluate,fabric}.js`,
29 unit tests). Everything below renders FROM those modules — no view resolves
a directive, derives a scope or types a figure by hand.

## Stack

Vite + React 18, plain CSS with tokens on `:root` (dark default — the reveal
wall is dark; a light theme is optional and must pass axe if shipped),
`lucide-react` icons. No router library: a `view` state + `?view=` param.
Port from `D:\Garth P\dreamcatcher-showcase`: `eslint.config.js`,
`playwright.config.js`, `scripts/{whiteglove,mobile,viewport}-sweep.mjs`,
`scripts/run-release-sweeps.mjs`, `scripts/capture-og.mjs`,
`e2e/accessibility.spec.js` (axe WCAG A/AA, zero exclusions), `vercel.json`,
`index.html` with `noindex` + OG meta.

## Fixtures — `src/data/`

- `anchor.js` — every timestamp is an offset from today (no absolute dates in
  data, prose or JSX).
- `scenarios.js` — named requests + scripted port results + trusted caller
  context. Each scenario is RUN through `evaluate()` then `deriveTicket()` at
  load; the ledger is the output, never a hand-written directive.
- `callers.js` — trusted caller contexts (grants + authority): e.g.
  `svc.lead-intake` (crm.contact.write, L2), `svc.marketing-sync`
  (crm.contact.read only, L2), `svc.sandbox` (crm.contact.write, L1).
- Tenant: a fictional credit union (continuity with the Aether SDK demo — the
  `lead.crm` shard pushes through Aether; name it, it is revealed).

Scenario set (minimum): routed lead · model unavailable under advisory ·
missing tenant context · disallowed event · reserved-name smuggle ·
missing_trusted_scope · insufficient_authority · advisor ADVISE · advisor
below threshold · advisor needs_input → continuation → ADVISE · tampered
continuation · advisor "actionable" candidate that still cannot activate.

## Screens

1. **Decisions** (home) — ledger of evaluated requests: directive chip, persona
   policy, event, matrix row, model status, fabric result. Framed as the
   composed runtime's history. Filters by directive / persona / result.
2. **Decision detail — the governed path** (signature 1) — left→right rail:
   Request → Pre-matrix checks (six, each pass/fail with the engine's field
   names) → Outcome matrix (the row that fired, highlighted in the full table)
   → Directive (canonical JSON) → ‖ boundary ‖ → Fabric: trusted caller →
   ticket (scopes shown as *required* vs *granted*, the unused grants visibly
   NOT copied) or rejection → Outcome. Correlation chain strip: `request_id`,
   `directive_id`, `ticket_id` with equality marks. A "re-run with…" control
   swaps the caller context or the port result and re-derives the whole rail.
3. **Advisor** (signature 2) — the actionless persona: prompt in, port result
   scripted, `REQUEST_INPUT` with a caller-held continuation card (what it
   carries, and the explicit "carries no authority / no expiry / no replay
   protection — the caller owns those"), clarification, `ADVISE`. A tamper
   toggle edits the continuation and shows the fail-closed result with no
   replacement. A panel states why this persona cannot activate (no route;
   `ACTIVATE_SHARD` not in its allowlist) — derived from the policy record.
4. **Outcome matrix** — interactive: route × participation × model result ×
   "ADVISE allowed" → directive, row highlighted; registry-invalid
   combinations disabled with the rule that forbids them.
5. **Policies** — persona + action records as reviewable artifacts, registry
   validation (`validatePersonaPolicy`) live on a scaffolded draft, and a
   side-by-side diff of two versions. Offline verbs only
   (`validate` / `diff` / `scaffold`). No "impact on past decisions" — the
   engine stores nothing to replay.
6. **Boundary** — the ownership map (what Janus owns / what it refuses to
   own), linking to the archify architecture figure at T-2.

States for every surface: empty, loading (first paint skeleton), error
(a scenario that throws renders an error card, not a blank), not-applicable.

## Mobile companion

Bottom tabs: Decisions · Advisor · Matrix. Decision detail becomes a vertical
rail. Policies diff and the "re-run with…" authoring controls are
workstation-only (`DESK_ONLY_VIEWS`), with `?view=desktop` as the escape
hatch. No footers. Derive the phone layout from a static walk of every
multi-column grid plus a runtime walk at 375/768/1024.

## Landing + onboarding

Landing gate `sessionStorage`-scoped, states "mock data · the engine is
private". Onboarding = domain orientation in four beats: one request → one
directive → the boundary → the ticket. Sign-out clears the flag.

## Gates to add at T-3

view-honesty (no digits typed in views), data-coherence (anchor-relative),
ledger gate (every ledger row equals `evaluate()`'s output for its scenario;
one directive per request; a fabric result only beside `ACTIVATE_SHARD`;
protocol correlation equalities), lint, axe, the three sweeps.
