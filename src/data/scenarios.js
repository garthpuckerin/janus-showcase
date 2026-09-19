/* Named requests for a fictional credit union tenant, each shaped exactly
   like a DecisionRequestV2. Nothing here resolves a directive, a matrix row
   or a scope — `src/data/ledger.js` runs every one of these through the real
   `evaluate()` and `deriveTicket()` and the views render that output only. */
import { minutesAgo, hoursAgo } from './anchor.js';

const TENANT_ID = 'harbor-cu';

const leadRequest = (requestId, { payload, context = { tenant_id: TENANT_ID }, eventType = 'lead.received' }) => ({
  schema_version: '2.0',
  request_id: requestId,
  persona: {
    type: 'audience',
    id: 'contact-intake',
    policy_id: 'audience.crm-contact-upsert',
    policy_version: 1,
    context,
  },
  event: { type: eventType, payload },
  state: {},
});

const advisorRequest = (requestId, { payload, eventType = 'business.strategy.requested' }) => ({
  schema_version: '2.0',
  request_id: requestId,
  persona: {
    type: 'advisor',
    id: 'strategy-desk',
    policy_id: 'advisor.business-strategy',
    policy_version: 1,
    context: { tenant_id: TENANT_ID },
  },
  event: { type: eventType, payload },
  state: {},
});

const accepted = (classification, confidence, extra = {}) => ({
  status: 'ok',
  candidate: { classification, confidence, ...extra },
});

export const SCENARIOS = Object.freeze([
  {
    id: 'lead-activates',
    title: 'Routed lead activates the CRM shard',
    summary: 'An accepted lead event routes to the CRM action policy and the advisory model classifies it actionable.',
    occurredAt: minutesAgo(6),
    request: leadRequest('req-lead-001', {
      payload: { email: 'dana.reyes@example.com', company: 'Northwind Federal', first_name: 'Dana', last_name: 'Reyes', utm_source: 'webinar' },
    }),
    port: accepted('actionable', 0.91),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-needs-more-input',
    title: 'Routed lead needs one more field before activating',
    summary: 'The model asks for a phone number before it will classify the lead; the persona mints a caller-held continuation for it.',
    occurredAt: minutesAgo(15),
    request: leadRequest('req-lead-009', {
      payload: { email: 'aurelio.pham@example.com', company: 'Tidewater Municipal Credit Union' },
    }),
    port: accepted('needs_input', 0.7, { requested_fields: ['phone'] }),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'advisor-actionable-cannot-activate',
    title: 'An actionable candidate still cannot activate',
    summary: 'The model calls the candidate actionable, but the advisor persona has no action route in its policy, so it can never issue ACTIVATE_SHARD.',
    occurredAt: minutesAgo(28),
    request: advisorRequest('req-strategy-005', {
      payload: { prompt: 'Should Harbor Credit Union acquire the downtown branch lease early?' },
    }),
    port: accepted('actionable', 0.95),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-timeout-still-activates',
    title: 'Model timeout does not block an advisory route',
    summary: 'The advisory model port times out; the routed action still activates because participation is advisory, not required.',
    occurredAt: minutesAgo(52),
    request: leadRequest('req-lead-002', {
      payload: { email: 'marcus.oyelaran@example.com', company: 'Beacon Credit Partners' },
    }),
    port: { status: 'timeout' },
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-missing-tenant',
    title: 'Missing tenant context fails closed',
    summary: 'The request carries no tenant_id in the persona context, so evaluation fails closed before the model is ever called.',
    occurredAt: hoursAgo(1.5),
    request: leadRequest('req-lead-003', {
      payload: { email: 'priya.natarajan@example.com', company: 'Sable Peak Realty' },
      context: {},
    }),
    port: accepted('actionable', 0.88),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-disallowed-event',
    title: 'Disallowed event type is refused',
    summary: '"lead.deleted" is not in the persona policy\'s allowed event types, so the request fails closed before routing.',
    occurredAt: hoursAgo(2.25),
    request: leadRequest('req-lead-004', {
      payload: { email: 'sofia.marchetti@example.com', company: 'Anchorline Freight' },
      eventType: 'lead.deleted',
    }),
    port: accepted('actionable', 0.9),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-reserved-name-smuggle',
    title: 'Reserved field name is refused before the model',
    summary: 'The event payload smuggles shard_id, a name the contract reserves; the request fails closed and the model is never called.',
    occurredAt: hoursAgo(3),
    request: leadRequest('req-lead-005', {
      payload: { email: 'holt.abernathy@example.com', company: 'Vantage Mill Co-op', shard_id: 'billing.ledger' },
    }),
    port: accepted('actionable', 0.9),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'lead-marketing-sync-missing-scope',
    title: 'Marketing-sync caller lacks the write scope',
    summary: 'The action policy activates, but the trusted caller bound to it can only read CRM contacts, not write them.',
    occurredAt: hoursAgo(4),
    request: leadRequest('req-lead-006', {
      payload: { email: 'talia.bourgeois@example.com', company: 'Harborline Community Foundation' },
    }),
    port: accepted('actionable', 0.93),
    callerId: 'svc.marketing-sync',
  },
  {
    id: 'lead-sandbox-insufficient-authority',
    title: 'Sandbox caller authority is below the policy ceiling',
    summary: 'The sandbox caller holds the write scope but only L1 authority, one level under what the action policy requires.',
    occurredAt: hoursAgo(5),
    request: leadRequest('req-lead-007', {
      payload: { email: 'wen.okafor@example.com', company: 'Cascadia Grain Exchange' },
    }),
    port: accepted('actionable', 0.9),
    callerId: 'svc.sandbox',
  },
  {
    id: 'lead-falls-back-to-advice',
    title: 'Routed lead falls back to advice',
    summary: 'The model classifies the lead not_actionable; the persona is allowed to ADVISE, so the routed action is not taken.',
    occurredAt: hoursAgo(6),
    request: leadRequest('req-lead-008', {
      payload: { email: 'georgina.ilic@example.com', company: 'Millpond Agricultural Trust' },
    }),
    port: accepted('not_actionable', 0.7, { advice: 'Contact information is incomplete; route to manual review before creating a CRM record.' }),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'advisor-advises',
    title: 'Advisor recommends without acting',
    summary: 'The strategy advisor has no action route; an accepted, confident candidate can only ever produce advice.',
    occurredAt: hoursAgo(7),
    request: advisorRequest('req-strategy-001', {
      payload: { prompt: 'Should Harbor Credit Union open a second branch this year?' },
    }),
    port: accepted('not_actionable', 0.82, { advice: 'Pilot a smaller service kiosk before committing to a full branch build-out.' }),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'advisor-below-threshold',
    title: 'Advisor confidence below the policy floor',
    summary: "The candidate is accepted but its confidence sits under the policy's 0.65 floor, so the model counts as unavailable and required participation fails closed.",
    occurredAt: hoursAgo(10),
    request: advisorRequest('req-strategy-002', {
      payload: { prompt: 'Is now the right time to refinance the branch mortgage portfolio?' },
    }),
    port: accepted('not_actionable', 0.5, { advice: 'Uncertain — refinancing terms are volatile this quarter.' }),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'advisor-needs-input',
    title: 'Advisor requests risk tolerance before advising',
    summary: "The model needs one more allowlisted field before it can advise; the persona mints a caller-held continuation for it.",
    occurredAt: hoursAgo(13),
    request: advisorRequest('req-strategy-003', {
      payload: { prompt: 'How should Harbor Credit Union prioritize its technology budget next cycle?' },
    }),
    port: accepted('needs_input', 0.8, { requested_fields: ['risk_tolerance'] }),
    callerId: 'svc.lead-intake',
  },
  {
    id: 'advisor-clarification-advises',
    title: 'Clarification answer completes the advisory',
    summary: "The caller answers the continuation's one requested field; the revalidated follow-up request now advises.",
    occurredAt: hoursAgo(12),
    continuationFrom: 'advisor-needs-input',
    request: advisorRequest('req-strategy-004', {
      payload: { prompt: 'How should Harbor Credit Union prioritize its technology budget next cycle?', risk_tolerance: 'moderate' },
      eventType: 'business.strategy.clarification.received',
    }),
    port: accepted('not_actionable', 0.88, { advice: 'Fund core-banking resiliency first; treat member-facing app features as a stretch goal.' }),
    callerId: 'svc.lead-intake',
  },
]);

export const SCENARIOS_BY_ID = Object.freeze(
  Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, scenario])),
);
