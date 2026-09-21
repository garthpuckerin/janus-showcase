import { useCallback, useState } from 'react';
import { useAdvisorWalk } from '../../hooks/useAdvisorWalk.js';
import { STEP } from '../../components/advisor/advisorSteps.js';
import { wizardModel, PRIMARY_ACTION } from '../../components/companion/advisor/wizardModel.js';
import { WizardProgress } from '../../components/companion/advisor/WizardProgress.jsx';
import { WizardActionBar } from '../../components/companion/advisor/WizardActionBar.jsx';
import { WizardAskStep } from '../../components/companion/advisor/WizardAskStep.jsx';
import { WizardResultStep } from '../../components/companion/advisor/WizardResultStep.jsx';
import { WizardContinuationStep } from '../../components/companion/advisor/WizardContinuationStep.jsx';
import { WizardClarifyStep } from '../../components/companion/advisor/WizardClarifyStep.jsx';
import { WizardTamperBanner } from '../../components/companion/advisor/WizardTamperBanner.jsx';

const ASK_FORM_ID = 'wizard-advisor-ask-form';
const CLARIFY_FORM_ID = 'wizard-advisor-clarify-form';

/**
 * The phone Advisor: one step per screen, in the order `advisorSteps.js`
 * defines, built entirely on `useAdvisorWalk()` — the same state machine the
 * desktop `AdvisorView` uses. `requestedStep` is this view's own navigation
 * state (which screen the operator asked to see); `wizardModel()` clamps it
 * to what the walk has actually reached.
 */
export function AdvisorWizardView() {
  const walk = useAdvisorWalk();
  const [requestedStep, setRequestedStep] = useState(STEP.ASK);
  const model = wizardModel({ stepStatuses: walk.stepStatuses, requestedStep });

  const goBack = useCallback(() => setRequestedStep((step) => Math.max(STEP.ASK, step - 1)), []);
  const advanceTo = useCallback((step) => setRequestedStep(step), []);

  const handleAskSubmit = useCallback(() => {
    walk.handleAskSubmit();
    setRequestedStep(STEP.ASK_RESULT);
  }, [walk]);

  const handleClarifySubmit = useCallback(() => {
    walk.handleClarifySubmit();
    setRequestedStep(STEP.CLARIFY_RESULT);
  }, [walk]);

  const handleStartOver = useCallback(() => {
    walk.handleReset();
    setRequestedStep(STEP.ASK);
  }, [walk]);

  let onPrimary = handleAskSubmit; // STEP.ASK
  if (model.current === STEP.ASK_RESULT) {
    onPrimary = model.primaryAction === PRIMARY_ACTION.CONTINUE
      ? () => advanceTo(STEP.CONTINUATION)
      : handleStartOver;
  } else if (model.current === STEP.CONTINUATION) onPrimary = () => advanceTo(STEP.CLARIFY);
  else if (model.current === STEP.CLARIFY) onPrimary = handleClarifySubmit;
  else if (model.current === STEP.CLARIFY_RESULT) onPrimary = handleStartOver;

  return (
    <section aria-labelledby="advisor-wizard-heading" className="advisor-wizard">
      <h1 id="advisor-wizard-heading" className="visually-hidden">Advisor</h1>

      <WizardProgress current={model.current} total={model.total} notNeeded={model.notNeeded} />

      {model.current === STEP.ASK && (
        <WizardAskStep
          formId={ASK_FORM_ID}
          values={walk.askValues}
          onFieldChange={walk.handleAskFieldChange}
          portKey={walk.askPortKey}
          onPortKeyChange={walk.setAskPortKey}
          onSubmit={handleAskSubmit}
        />
      )}

      {model.current === STEP.ASK_RESULT && walk.askOutcome && (
        <WizardResultStep heading="Result" evaluation={walk.askOutcome.evaluation} explanation={walk.askExplanation} />
      )}

      {model.current === STEP.CONTINUATION && walk.askOutcome?.evaluation.continuation && (
        <WizardContinuationStep continuation={walk.askOutcome.evaluation.continuation} />
      )}

      {model.current === STEP.CLARIFY && (
        <WizardClarifyStep
          formId={CLARIFY_FORM_ID}
          requestedFields={walk.requestedFields}
          values={walk.clarifyValues}
          onFieldChange={walk.handleClarifyFieldChange}
          portKey={walk.clarifyPortKey}
          onPortKeyChange={walk.setClarifyPortKey}
          tamperMode={walk.tamperMode}
          onTamperModeChange={walk.setTamperMode}
          onSubmit={handleClarifySubmit}
        />
      )}

      {model.current === STEP.CLARIFY_RESULT && walk.clarifyOutcome && (
        <WizardResultStep
          heading="Result"
          evaluation={walk.clarifyOutcome.evaluation}
          explanation={walk.clarifyExplanation}
          tamperBanner={walk.clarifyOutcome.tampered && <WizardTamperBanner portCallCount={walk.clarifyOutcome.portCallCount} />}
        />
      )}

      <WizardActionBar
        primaryLabel={model.primaryAction}
        onPrimary={onPrimary}
        showBack={model.canGoBack}
        onBack={goBack}
      />
    </section>
  );
}
