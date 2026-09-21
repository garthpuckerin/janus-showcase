import { policyRefLabel } from '../utils/format.js';
import { ADVISOR_POLICY } from '../components/advisor/advisorFlow.js';
import { useAdvisorWalk } from '../hooks/useAdvisorWalk.js';
import { STEP } from '../components/advisor/advisorSteps.js';
import { AdvisorStepCard } from '../components/advisor/AdvisorStepCard.jsx';
import { AdvisorAskForm } from '../components/advisor/AdvisorAskForm.jsx';
import { AdvisorClarifyForm } from '../components/advisor/AdvisorClarifyForm.jsx';
import { ContinuationCard } from '../components/advisor/ContinuationCard.jsx';
import { AdvisorResultBlock } from '../components/advisor/AdvisorResultBlock.jsx';
import { TamperResultBanner } from '../components/advisor/TamperResultBanner.jsx';
import { WhyCannotActPanel } from '../components/advisor/WhyCannotActPanel.jsx';

export function AdvisorView() {
  const walk = useAdvisorWalk();

  return (
    <section aria-labelledby="advisor-heading" className="advisor-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{policyRefLabel(ADVISOR_POLICY.policy_id, ADVISOR_POLICY.version)}</span>
          <h1 id="advisor-heading" className="page-heading__title">Advisor</h1>
          <p className="page-heading__lede">
            This persona has no action route, so nothing it produces can ever become work.
          </p>
        </div>
      </div>

      <div className="advisor-layout">
        <div className="advisor-main">
          <AdvisorStepCard index={STEP.ASK} title="Ask" status={walk.stepStatuses[STEP.ASK]}>
            <AdvisorAskForm
              values={walk.askValues}
              onFieldChange={walk.handleAskFieldChange}
              portKey={walk.askPortKey}
              onPortKeyChange={walk.setAskPortKey}
              onSubmit={walk.handleAskSubmit}
            />
          </AdvisorStepCard>

          <div aria-live="polite">
            <AdvisorStepCard index={STEP.ASK_RESULT} title="Result" status={walk.stepStatuses[STEP.ASK_RESULT]}>
              {walk.askOutcome && (
                <AdvisorResultBlock evaluation={walk.askOutcome.evaluation} explanation={walk.askExplanation} />
              )}
            </AdvisorStepCard>
          </div>

          <div aria-live="polite">
            <AdvisorStepCard
              index={STEP.CONTINUATION}
              title="Continuation — held by the caller"
              status={walk.stepStatuses[STEP.CONTINUATION]}
            >
              {walk.askOutcome?.evaluation.continuation && (
                <ContinuationCard continuation={walk.askOutcome.evaluation.continuation} />
              )}
            </AdvisorStepCard>
          </div>

          <AdvisorStepCard index={STEP.CLARIFY} title="Clarify" status={walk.stepStatuses[STEP.CLARIFY]}>
            <AdvisorClarifyForm
              requestedFields={walk.requestedFields}
              values={walk.clarifyValues}
              onFieldChange={walk.handleClarifyFieldChange}
              portKey={walk.clarifyPortKey}
              onPortKeyChange={walk.setClarifyPortKey}
              tamperMode={walk.tamperMode}
              onTamperModeChange={walk.setTamperMode}
              onSubmit={walk.handleClarifySubmit}
            />
          </AdvisorStepCard>

          <div aria-live="polite">
            <AdvisorStepCard index={STEP.CLARIFY_RESULT} title="Result" status={walk.stepStatuses[STEP.CLARIFY_RESULT]}>
              {walk.clarifyOutcome && (
                <>
                  {walk.clarifyOutcome.tampered && (
                    <TamperResultBanner portCallCount={walk.clarifyOutcome.portCallCount} />
                  )}
                  <AdvisorResultBlock evaluation={walk.clarifyOutcome.evaluation} explanation={walk.clarifyExplanation} />
                  {walk.clarifyOutcome.evaluation.continuation && (
                    <ContinuationCard continuation={walk.clarifyOutcome.evaluation.continuation} />
                  )}
                </>
              )}
            </AdvisorStepCard>
          </div>

          <button type="button" className="button button--secondary" onClick={walk.handleReset}>
            Reset
          </button>
        </div>

        <WhyCannotActPanel />
      </div>
    </section>
  );
}
