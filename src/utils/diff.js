/* A small, pure field diff between two plain records. Arrays are compared by
   value (order-sensitive; that's a meaningful difference for something like
   an allowlist), never mutates either input. */

function isArray(v) {
  return Array.isArray(v);
}

function valuesEqual(a, b) {
  if (isArray(a) && isArray(b)) {
    return a.length === b.length && a.every((item, index) => valuesEqual(item, b[index]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

/**
 * @returns {Array<{field: string, kind: 'added'|'removed'|'changed', before: *, after: *}>}
 *  sorted by field name, one entry per field that differs.
 */
export function diffRecords(a, b) {
  const fields = new Set([...Object.keys(a), ...Object.keys(b)]);
  const changes = [];
  for (const field of [...fields].sort()) {
    const inA = Object.prototype.hasOwnProperty.call(a, field);
    const inB = Object.prototype.hasOwnProperty.call(b, field);
    if (!inA && inB) {
      changes.push({ field, kind: 'added', before: undefined, after: b[field] });
    } else if (inA && !inB) {
      changes.push({ field, kind: 'removed', before: a[field], after: undefined });
    } else if (!valuesEqual(a[field], b[field])) {
      changes.push({ field, kind: 'changed', before: a[field], after: b[field] });
    }
  }
  return changes;
}
