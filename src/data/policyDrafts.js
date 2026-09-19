/* A fixture draft — a hypothetical `@2` of the canonical audience persona
   policy — used only to demonstrate the offline `diff` tool. It is never
   loaded into the engine and never appears anywhere the ledger or evaluate()
   runs. */
import { PERSONA_POLICIES } from '../domain/policies.js';

const CANONICAL = PERSONA_POLICIES.find((p) => p.policy_id === 'audience.crm-contact-upsert');

export const AUDIENCE_POLICY_DRAFT_V2 = Object.freeze({
  ...CANONICAL,
  version: 2,
  model_participation: 'required',
  minimum_model_confidence: 0.7,
});

export const AUDIENCE_POLICY_CANONICAL = CANONICAL;
