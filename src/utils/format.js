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
