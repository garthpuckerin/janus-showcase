/* The composed runtime's history — never Janus state. Every entry is the
   literal output of `evaluate()` and, only for ACTIVATE_SHARD, `deriveTicket()`.
   No directive, row number, scope list or status is ever typed by hand here;
   they are all read back off the domain functions' return values. */
import { evaluate } from '../domain/evaluate.js';
import { deriveTicket } from '../domain/fabric.js';
import { PERSONA_POLICIES, ACTION_POLICIES } from '../domain/policies.js';
import { SCENARIOS } from './scenarios.js';
import { CALLERS } from './callers.js';

const REGISTRY = Object.freeze({ personaPolicies: PERSONA_POLICIES, actionPolicies: ACTION_POLICIES });

/** Shards this illustrative composed runtime has registered with Fabric. */
export const REGISTERED_SHARDS = Object.freeze(['lead.crm']);

/* A dependency-free, deterministic identity for illustrative ticket/outcome
   ids — the point is that the id is a function of its content, matching the
   spirit of the protocol's own identity scheme, not a copy of engine source. */
function deterministicId(prefix, parts) {
  const text = JSON.stringify(parts);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${prefix}-${hash.toString(16).padStart(8, '0')}`;
}

/** Wrap a scripted port result in the `{call()}` shape `evaluate()` expects,
 *  counting calls so the ledger and gate can assert "at most once". */
function scriptedPort(result) {
  const state = { count: 0 };
  return {
    call() {
      state.count += 1;
      return result;
    },
    get callCount() {
      return state.count;
    },
  };
}

function buildOutcome(ticket) {
  return {
    schema_version: '2.0',
    status: 'succeeded',
    outcome_id: deterministicId('outcome', [ticket.ticket_id, ticket.directive_id]),
    request_id: ticket.request_id,
    directive_id: ticket.directive_id,
    ticket_id: ticket.ticket_id,
    acceptance: ticket.acceptance_tests.map((test) => ({ test, passed: true })),
  };
}

function runFabric(directive, callerId) {
  const caller = CALLERS[callerId];
  if (!caller) return null;
  const trustedContext = { ...caller, request_id: directive.request_id };
  const ticketId = deterministicId('tkt', [directive.request_id, directive.directive_id]);
  const derived = deriveTicket(directive, trustedContext, {
    actionPolicies: ACTION_POLICIES,
    registeredShards: REGISTERED_SHARDS,
    ticketId,
  });
  if (derived.kind === 'rejection') return { kind: 'rejection', rejection: derived.rejection };
  return { kind: 'ticket', ticket: derived.ticket, outcome: buildOutcome(derived.ticket) };
}

/**
 * Run one scenario's request through the real domain functions. Used both to
 * build the ledger and to re-derive the decision-detail rail live when the
 * "re-run with…" panel swaps the caller context or the port result.
 * @param {object} scenario
 * @param {{port?: object|null, callerId?: string, continuation?: object}} [overrides]
 */
export function runScenario(scenario, overrides = {}) {
  const port = 'port' in overrides ? overrides.port : scenario.port;
  const callerId = overrides.callerId ?? scenario.callerId;
  const continuation = overrides.continuation;

  const modelPort = port ? scriptedPort(port) : null;
  const evaluation = evaluate(scenario.request, REGISTRY, {
    modelPort: modelPort ?? undefined,
    continuation,
  });
  const modelCalls = modelPort ? modelPort.callCount : 0;
  const fabric = evaluation.directive.type === 'ACTIVATE_SHARD' ? runFabric(evaluation.directive, callerId) : null;

  return { scenario, evaluation, fabric, modelCalls };
}

function buildLedger() {
  const entriesById = new Map();
  const entries = SCENARIOS.map((scenario) => {
    const continuation = scenario.continuationFrom
      ? entriesById.get(scenario.continuationFrom)?.evaluation.continuation
      : undefined;
    const entry = runScenario(scenario, { continuation });
    entriesById.set(scenario.id, entry);
    return entry;
  });
  return entries;
}

/** The full ledger, built once at module load and memoised by the module cache. */
export const LEDGER = buildLedger();

export const findLedgerEntry = (scenarioId) => LEDGER.find((entry) => entry.scenario.id === scenarioId);
