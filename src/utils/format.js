/** Render an ISO timestamp as time-relative-to-now text, e.g. "6 minutes ago". */
export function relativeTimeFromNow(isoString, now = new Date()) {
  const diffMs = now.getTime() - new Date(isoString).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export const policyRefLabel = (id, version) => `${id}@${version}`;

/* Human labels for the model-status enum `evaluate()` returns in
   `diagnostics.model_status`. The raw value is protocol-shaped (it is what
   the domain layer actually returns) but not itself prose — this is the one
   place a display label is derived from it. Unknown values fall back to the
   raw value itself rather than hiding information. */
const MODEL_STATUS_LABELS = Object.freeze({
  not_applicable: 'Not applicable — not reached',
  not_called: 'Not called',
  no_port: 'No port',
  timeout: 'Timed out',
  error: 'Port error',
  invalid_output: 'Invalid output',
  below_threshold: 'Below confidence threshold',
  accepted: 'Accepted',
});

export function modelStatusLabel(status) {
  return MODEL_STATUS_LABELS[status] ?? status;
}
