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

/* The composed runtime's five-step recall -> decide -> authorize -> execute
   -> record sequence. `side` names which side of the Janus/Fabric seam a
   step's own work happens on — `BoundaryView` uses it to render `decide` on
   a light card and `authorize`/`execute` on Fabric's panel, so the sequence
   itself visibly crosses the seam. */
export const COMPOSED_RUNTIME_STEPS = Object.freeze([
  {
    id: 'recall',
    label: 'Recall',
    side: 'janus',
    description: 'Read whatever operational memory the composed runtime keeps.',
  },
  {
    id: 'decide',
    label: 'Decide',
    side: 'janus',
    description: 'Janus evaluates one request and emits exactly one directive.',
  },
  {
    id: 'authorize',
    label: 'Authorize',
    side: 'fabric',
    description: 'Fabric validates the trusted caller and derives a least-authority ticket.',
  },
  {
    id: 'execute',
    label: 'Execute',
    side: 'fabric',
    description: 'The shard performs the action the ticket names, nothing more.',
  },
  {
    id: 'record',
    label: 'Record',
    side: 'janus',
    description: 'The outcome is written back; a memory failure is a warning, never a blocker.',
  },
].map(Object.freeze));
