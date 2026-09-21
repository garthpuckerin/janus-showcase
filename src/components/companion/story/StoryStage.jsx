import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { STAGE_COMPLETE, STAGE_FAILED } from '../../detail/stageStates.js';

const ICONS = Object.freeze({ [STAGE_COMPLETE]: CheckCircle2, [STAGE_FAILED]: XCircle });

/** One row of the phone stepper (docs/DESIGN-SYSTEM.md "the decision
 *  story"): a `<details>` for a reached stage — open by default only when
 *  `open` is true, i.e. this is the explaining stage — or, for a stage
 *  `stageStates()` marked not reached, a plain non-expandable row reading
 *  "not reached". `dark` switches the left-rule/icon palette for stages
 *  05–06, which sit on Fabric's full-bleed dark region. The `data-stage`
 *  attribute is the mobile sweep's hook for "exactly one stage is open". */
export function StoryStage({ stage, index, dark = false, open = false, children }) {
  const reached = stage.state !== 'not-reached';
  const Icon = ICONS[stage.state] ?? MinusCircle;
  const itemClass = `story-item story-item--${stage.state}${dark ? ' story-item--dark' : ''}`;

  const heading = (
    <>
      <Icon size={18} className="story-item__icon" aria-hidden="true" />
      <span className="story-item__index">{String(index + 1).padStart(2, '0')}</span>
      <span className="story-item__title">{stage.title}</span>
      <span className="story-item__status">{stage.status}</span>
    </>
  );

  if (!reached) {
    return (
      <li className={itemClass} data-stage={stage.key}>
        <div className="story-item__summary story-item__summary--static">{heading}</div>
      </li>
    );
  }

  return (
    <li className={itemClass} data-stage={stage.key}>
      <details open={open}>
        <summary className="story-item__summary">{heading}</summary>
        <div className="story-item__body">{children}</div>
      </details>
    </li>
  );
}
