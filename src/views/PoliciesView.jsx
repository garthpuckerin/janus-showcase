import { PERSONA_POLICIES, ACTION_POLICIES } from '../domain/policies.js';
import { PolicyRecordCard } from '../components/policies/PolicyRecordCard.jsx';
import { DraftValidator } from '../components/policies/DraftValidator.jsx';
import { PolicyDiff } from '../components/policies/PolicyDiff.jsx';
import { AUDIENCE_POLICY_CANONICAL, AUDIENCE_POLICY_DRAFT_V2 } from '../data/policyDrafts.js';

export function PoliciesView() {
  return (
    <section aria-labelledby="policies-heading">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Understand</span>
          <h1 id="policies-heading" className="page-heading__title">Policies</h1>
          <p className="page-heading__lede">
            {PERSONA_POLICIES.length} persona policies and {ACTION_POLICIES.length} action policy, reviewable as
            records — plus the engine's offline policy tools.
          </p>
        </div>
      </div>

      <div className="policy-registry">
        {PERSONA_POLICIES.map((policy) => (
          <PolicyRecordCard key={policy.policy_id} policy={policy} kind="persona" />
        ))}
        {ACTION_POLICIES.map((policy) => (
          <PolicyRecordCard key={policy.policy_id} policy={policy} kind="action" />
        ))}
      </div>

      <DraftValidator />

      <PolicyDiff before={AUDIENCE_POLICY_CANONICAL} after={AUDIENCE_POLICY_DRAFT_V2} />
    </section>
  );
}
