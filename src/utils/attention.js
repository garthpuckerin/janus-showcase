/* Pure grouping over the ledger — the phone companion's Attention tab, the
 * home screen. Never mutates the ledger; every reason string is read off
 * `evaluation` or `fabric`, never typed by hand at the display point. An
 * entry belongs to at most one group; entries that need nothing (ADVISE, a
 * ticket that succeeded) appear in none. Newest first within a group. */

const GROUP_TITLES = Object.freeze({
  rejected: 'Rejected by Fabric',
  'failed-closed': 'Failed closed before the matrix',
  'needs-input': 'Waiting on input',
});

const GROUP_ORDER = Object.freeze(['rejected', 'failed-closed', 'needs-input']);

function classify(entry) {
  if (entry.fabric?.kind === 'rejection') return 'rejected';
  if (entry.evaluation.diagnostics.matrix_row === null) return 'failed-closed';
  if (entry.evaluation.directive.type === 'REQUEST_INPUT') return 'needs-input';
  return null;
}

/** Fabric's own rejection code, verbatim — never reworded. */
function rejectedReason(entry) {
  return entry.fabric.rejection.code;
}

/** The name of the first pre-matrix check that failed. */
function failedClosedReason(entry) {
  const failed = entry.evaluation.trace.find((step) => step.ok === false);
  return failed ? failed.check : 'unknown check';
}

/** The fields the matrix's REQUEST_INPUT directive asked for, or a plain
 *  statement that none were requested (a matrix-level REQUEST_INPUT can
 *  resolve with no continuation, e.g. when the model result was never
 *  `needs_input`). */
function needsInputReason(entry) {
  const fields = entry.evaluation.directive.payload.requested_fields ?? [];
  return fields.length ? fields.join(', ') : 'no further field requested';
}

const REASON_BY_GROUP = Object.freeze({
  rejected: rejectedReason,
  'failed-closed': failedClosedReason,
  'needs-input': needsInputReason,
});

const byNewestFirst = (a, b) => new Date(b.entry.scenario.occurredAt) - new Date(a.entry.scenario.occurredAt);

/**
 * @param {Array} ledger the ledger's entries (never mutated)
 * @returns {{total: number, needing: number, groups: Array<{id: string, title: string, items: Array<{entry: object, reason: string}>}>}}
 */
export function groupAttention(ledger) {
  const buckets = { rejected: [], 'failed-closed': [], 'needs-input': [] };

  for (const entry of ledger) {
    const groupId = classify(entry);
    if (!groupId) continue;
    buckets[groupId].push({ entry, reason: REASON_BY_GROUP[groupId](entry) });
  }

  const groups = GROUP_ORDER
    .map((id) => ({ id, title: GROUP_TITLES[id], items: [...buckets[id]].sort(byNewestFirst) }))
    .filter((group) => group.items.length > 0);

  const needing = groups.reduce((sum, group) => sum + group.items.length, 0);
  return { total: ledger.length, needing, groups };
}
