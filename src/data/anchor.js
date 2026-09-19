/* Every timestamp the cockpit shows is an offset from the moment this module
   loaded — never an absolute date. That keeps the demo evergreen: no scenario
   ever reads as "last year's data" no matter when it is opened. */

const ANCHOR_MS = Date.now();

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** ISO timestamp `n` minutes before the load-time anchor. */
export const minutesAgo = (n) => new Date(ANCHOR_MS - n * MINUTE_MS).toISOString();

/** ISO timestamp `n` hours before the load-time anchor. */
export const hoursAgo = (n) => new Date(ANCHOR_MS - n * HOUR_MS).toISOString();

/** ISO timestamp `n` days before the load-time anchor. */
export const daysAgo = (n) => new Date(ANCHOR_MS - n * DAY_MS).toISOString();

/** The anchor itself, exposed so views can compute "time ago" consistently. */
export const anchorNow = () => new Date(ANCHOR_MS);
