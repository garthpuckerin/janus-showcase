import { useCallback, useMemo, useState } from 'react';
import { PERSONA_TYPES, validatePersonaPolicy } from '../../domain/policies.js';
import { PARTICIPATION } from '../../domain/matrix.js';
import { scaffoldPersonaPolicy } from './scaffold.js';

const LEAD_ROUTE = Object.freeze({
  schema_version: '2.0',
  event_type: 'lead.received',
  action_policy_ref: 'lead.crm.contact-upsert@1',
});

function toggleRoute(draft, hasRoute) {
  if (hasRoute) {
    return {
      ...draft,
      action_routes: [LEAD_ROUTE],
      allowed_action_policy_ids: [LEAD_ROUTE.action_policy_ref],
    };
  }
  return { ...draft, action_routes: [], allowed_action_policy_ids: [] };
}

function toggleDirectiveType(draft, type, include) {
  const next = include
    ? [...new Set([...draft.allowed_directive_types, type])]
    : draft.allowed_directive_types.filter((t) => t !== type);
  return { ...draft, allowed_directive_types: next };
}

/** An editable draft persona policy, validated live against the same
 *  `validatePersonaPolicy()` the engine's registry runs at load time. */
export function DraftValidator() {
  const [draft, setDraft] = useState(scaffoldPersonaPolicy);

  const hasRoute = draft.action_routes.length > 0;
  const activatesShard = draft.allowed_directive_types.includes('ACTIVATE_SHARD');

  const errors = useMemo(() => validatePersonaPolicy(draft), [draft]);

  const handlePersonaType = useCallback((event) => {
    const persona_type = event.target.value;
    setDraft((prev) => ({ ...prev, persona_type }));
  }, []);

  const handleParticipation = useCallback((event) => {
    const model_participation = event.target.value;
    setDraft((prev) => ({ ...prev, model_participation }));
  }, []);

  const handleRouteToggle = useCallback((event) => {
    setDraft((prev) => toggleRoute(prev, event.target.checked));
  }, []);

  const handleActivateShardToggle = useCallback((event) => {
    setDraft((prev) => toggleDirectiveType(prev, 'ACTIVATE_SHARD', event.target.checked));
  }, []);

  const handleReset = useCallback(() => setDraft(scaffoldPersonaPolicy()), []);

  return (
    <div className="panel policy-draft">
      <h2 className="rail-stage__heading">Validate a draft</h2>
      <p className="page-framing">
        Offline policy tools — <code>validate</code>, <code>diff</code> and <code>scaffold</code> — run against the
        registry rules without ever loading the draft into the engine.
      </p>
      <div className="policy-draft__controls">
        <div className="field">
          <label htmlFor="draft-persona-type">Persona type</label>
          <select id="draft-persona-type" value={draft.persona_type} onChange={handlePersonaType}>
            {PERSONA_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="draft-participation">Model participation</label>
          <select id="draft-participation" value={draft.model_participation} onChange={handleParticipation}>
            {PARTICIPATION.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--checkbox">
          <label htmlFor="draft-activate-shard">
            <input id="draft-activate-shard" type="checkbox" checked={activatesShard} onChange={handleActivateShardToggle} />
            Allow ACTIVATE_SHARD
          </label>
        </div>
        <div className="field field--checkbox">
          <label htmlFor="draft-route">
            <input id="draft-route" type="checkbox" checked={hasRoute} onChange={handleRouteToggle} />
            Route lead.received to lead.crm.contact-upsert@1
          </label>
        </div>
        <button type="button" className="button button--ghost" onClick={handleReset}>
          Reset draft
        </button>
      </div>

      <div aria-live="polite" className="policy-draft__result">
        {errors.length === 0 ? (
          <p className="policy-draft__valid" role="status">
            Registry-valid — this draft would load.
          </p>
        ) : (
          <div className="error-card" role="alert">
            <h2>{errors.length} registry error{errors.length === 1 ? '' : 's'}</h2>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
