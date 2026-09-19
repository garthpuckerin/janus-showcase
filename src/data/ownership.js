/* The ownership map: what the decision engine owns, what it deliberately
   refuses to own, and what belongs to the separate execution fabric instead.
   Content mirrors README.md and the protocol's own boundary. */

export const JANUS_OWNS = Object.freeze([
  'The versioned v2 decision schemas',
  'Versioned persona and action policy records',
  'Event → action-policy routes',
  'Exactly one directive per request',
]);

export const JANUS_REFUSES = Object.freeze([
  'Execution of any kind',
  'Shard lifecycle',
  'Tickets, scopes or authority',
  'Operational memory',
  'Provider or model adapters',
  'Sessions or replay state',
]);

export const FABRIC_OWNS = Object.freeze([
  'Trusted-caller validation',
  'Least-authority ticket derivation',
  'Timeouts, retries and queues',
  'Terminal outcomes',
]);

export const COMPOSED_RUNTIME_STEPS = Object.freeze([
  'Recall — read whatever operational memory the composed runtime keeps',
  'Decide — Janus evaluates one request and emits exactly one directive',
  'Authorize — Fabric validates the trusted caller and derives a least-authority ticket',
  'Execute — the shard performs the action the ticket names, nothing more',
  'Record — the outcome is written back; a memory failure is a warning, never a blocker',
]);
