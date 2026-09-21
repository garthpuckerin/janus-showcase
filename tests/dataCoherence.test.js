/* Data-coherence gate — ties the fixture set back to the domain rules it
   claims to be a faithful run of. `tests/ledger.test.js` already proves:
     - exactly one directive per scenario, correlated by request_id
     - a fabric result exists only beside ACTIVATE_SHARD, and always beside it
     - every TICKET's correlation (request_id/directive_id/ticket_id/outcome
       ids) and that its allowed_scopes equal the referenced action policy's
       required_scopes exactly, with none of them forbidden
     - every pre-matrix failure made no model call and resolved no matrix row
     - no scenario calls the model port more than once
     - request_ids are unique
     - the fixture set covers all three directive types, ≥2 rejection codes,
       ≥5 distinct matrix rows
     - no file under src/data types a hand-written absolute YEAR (`\b20\d\d\b`)

   This file adds what that gate does NOT check:
     (a) every scenario timestamp derives from the anchor — no absolute-date
         literal anywhere under src/data, src/views or src/components (not
         just src/data, and not just a bare year), and the ledger's spread
         relative to "now" is sane;
     (d) a REJECTION carries the same exact correlation a ticket does
         (ledger.test.js checks a rejection carries no ticket/outcome and a
         code, but not that it references the directive it came from);
     (e) a ticket's allowed_scopes are not just equal to policy-required
         scopes, but a genuine SUBSET of what the trusted caller was granted
         (fabric.js only ever issues a ticket when that already holds, but
         nothing pins it against the fixture data directly);
     (f) every ledger entry's directive is exactly what `resolveDirective`
         returns for matrix inputs derived INDEPENDENTLY from the scenario's
         own persona policy and port result — not read back off the
         diagnostics `evaluate()` already computed, which would be circular;
     (g) every persona policy in the registry is itself a valid policy
         record, per the registry's own `validatePersonaPolicy`.

   (b) "exactly one directive per request" and (c) "a Fabric result exists
   only beside ACTIVATE_SHARD" are already fully covered by ledger.test.js
   and are not repeated here.

   If any assertion here fails against the real data, that is a real finding
   — this file does not get bent to make it pass. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER } from '../src/data/ledger.js';
import { anchorNow } from '../src/data/anchor.js';
import { CALLERS } from '../src/data/callers.js';
import { PERSONA_POLICIES, ACTION_POLICIES, validatePersonaPolicy } from '../src/domain/policies.js';
import { classifyModel } from '../src/domain/evaluate.js';
import { resolveDirective } from '../src/domain/matrix.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

/* ---------- (a) no absolute-date literal outside the anchor module ---------- */

const SCAN_DIRS = ['src/data', 'src/views', 'src/components'];
const EXCLUDED_FILES = new Set([path.join(REPO_ROOT, 'src', 'data', 'anchor.js')]);
const ISO_DATE = /\b20\d\d-\d\d-\d\d\b/;
const MONTH_DAY = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\.?\s+\d{1,2}(st|nd|rd|th)?\b/;

function walkSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/* Strip `//` line comments and `/* *\/` block comments before scanning —
   prose in a comment ("built for the Oct 1 reveal") is not a leaked literal
   the way the same text rendered to an operator would be. This is a
   best-effort strip (it does not understand string literals containing
   `//`), acceptable for an internal lint over a small, known source tree. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('no absolute-date literal (YYYY-MM-DD or "Month Day") appears in src/data, src/views or src/components source text, outside comments and the anchor module', () => {
  const offenders = [];
  for (const relDir of SCAN_DIRS) {
    const dir = path.join(REPO_ROOT, relDir);
    if (!fs.existsSync(dir)) continue;
    for (const file of walkSourceFiles(dir)) {
      if (EXCLUDED_FILES.has(file)) continue;
      const code = stripComments(fs.readFileSync(file, 'utf8'));
      const relative = path.relative(REPO_ROOT, file);
      const isoMatch = code.match(ISO_DATE);
      if (isoMatch) offenders.push(`${relative}: absolute date "${isoMatch[0]}"`);
      const monthMatch = code.match(MONTH_DAY);
      if (monthMatch) offenders.push(`${relative}: absolute date "${monthMatch[0]}"`);
    }
  }
  assert.deepEqual(offenders, [], `absolute-date literal(s) found:\n${offenders.join('\n')}`);
});

/* ---------- (a) the ledger straddles "now" sensibly ---------- */

test('the ledger straddles "now": the newest entry is at most 1 hour old and the oldest at most 14 days old, relative to the anchor', () => {
  // Observed today: newest is minutesAgo(6) (~0.1h), oldest is hoursAgo(13)
  // (~0.54 days) — both comfortably inside these bounds. The bounds
  // themselves stay generous (1h / 14d) rather than tight to the current
  // fixture set, so a reasonable new scenario doesn't need this test
  // re-tuned; they still catch a genuine mistake (a timestamp typo'd months
  // off, or an anchor helper called with the wrong unit).
  const now = anchorNow().getTime();
  const ages = LEDGER.map((entry) => now - new Date(entry.scenario.occurredAt).getTime());
  const newestAgeMs = Math.min(...ages);
  const oldestAgeMs = Math.max(...ages);

  assert.ok(newestAgeMs >= 0, 'no scenario timestamp is in the future relative to the anchor');
  assert.ok(newestAgeMs <= 60 * 60 * 1000, `newest entry is ${Math.round(newestAgeMs / 60000)} minutes old, expected ≤ 60`);
  assert.ok(oldestAgeMs <= 14 * 24 * 60 * 60 * 1000, `oldest entry is ${Math.round(oldestAgeMs / 3_600_000)} hours old, expected ≤ 336 (14 days)`);
});

/* ---------- (d) rejection correlation ---------- */

test('every rejection references the directive it came from', () => {
  const rejections = LEDGER.filter((entry) => entry.fabric?.kind === 'rejection');
  assert.ok(rejections.length > 0, 'the fixture set must include at least one rejection');
  for (const { scenario, evaluation, fabric } of rejections) {
    assert.equal(fabric.rejection.request_id, evaluation.directive.request_id, `${scenario.id}: rejection.request_id`);
    assert.equal(fabric.rejection.directive_id, evaluation.directive.directive_id, `${scenario.id}: rejection.directive_id`);
  }
});

/* ---------- (e) ticket scopes are a real subset of the caller's grants ---------- */

test("every ticket's allowed_scopes are a subset of the trusted caller's granted_scopes", () => {
  const tickets = LEDGER.filter((entry) => entry.fabric?.kind === 'ticket');
  assert.ok(tickets.length > 0, 'the fixture set must include at least one ticket');
  for (const { scenario, fabric } of tickets) {
    const caller = CALLERS[scenario.callerId];
    assert.ok(caller, `${scenario.id}: references an unknown caller "${scenario.callerId}"`);
    for (const scope of fabric.ticket.allowed_scopes) {
      assert.ok(
        caller.granted_scopes.includes(scope),
        `${scenario.id}: ticket scope "${scope}" is not in ${caller.caller_id}'s granted_scopes [${caller.granted_scopes.join(', ')}]`,
      );
    }
  }
});

/* ---------- (f) directive matches resolveDirective for independently-derived inputs ---------- */

test("every ledger entry's directive equals resolveDirective() for matrix inputs derived independently from the scenario's own policy and port result", () => {
  for (const { scenario, evaluation } of LEDGER) {
    if (evaluation.diagnostics.matrix_row === null) continue; // pre-matrix fail-closed: never reaches the matrix.

    const policy = PERSONA_POLICIES.find(
      (p) => p.policy_id === scenario.request.persona.policy_id && p.version === scenario.request.persona.policy_version,
    );
    assert.ok(policy, `${scenario.id}: references an unknown persona policy`);

    const routes = policy.action_routes.filter((r) => r.event_type === scenario.request.event.type);
    const routePresent = routes.length === 1;
    const participation = policy.model_participation;
    const modelResult = participation === 'none' ? 'not_called' : classifyModel(scenario.port, policy.minimum_model_confidence);
    const adviseAllowed = policy.allowed_directive_types.includes('ADVISE');

    const independently = resolveDirective({ routePresent, participation, modelResult, adviseAllowed });

    assert.equal(independently.row, evaluation.diagnostics.matrix_row, `${scenario.id}: matrix row`);
    assert.equal(independently.directive, evaluation.directive.type, `${scenario.id}: directive`);
  }
});

/* ---------- (g) every persona policy is itself valid ---------- */

test('every persona policy in the registry passes validatePersonaPolicy', () => {
  assert.ok(PERSONA_POLICIES.length > 0);
  for (const policy of PERSONA_POLICIES) {
    const errors = validatePersonaPolicy(policy, ACTION_POLICIES);
    assert.deepEqual(errors, [], `${policy.policy_id}@${policy.version}: ${errors.join('; ')}`);
  }
});
