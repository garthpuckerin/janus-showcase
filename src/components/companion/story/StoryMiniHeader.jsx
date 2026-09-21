import { ArrowLeft } from 'lucide-react';

/** The sticky mini-header (docs/DESIGN-SYSTEM.md "the decision story"): a
 *  back button and the scenario title, kept in view while the stepper scrolls
 *  underneath. The title WRAPS — it is the name of the thing being read, and
 *  truncating it ("Marketing-sync caller lacks the…") to make room for a chip
 *  was a defect. The directive chip lives on the verdict row instead.
 *  `directiveType` is still accepted so the caller's contract is unchanged. */
export function StoryMiniHeader({ title, onBack }) {
  return (
    <header className="story__header">
      <button type="button" className="story__back" onClick={onBack} aria-label="Back">
        <ArrowLeft size={18} aria-hidden="true" />
      </button>
      <h1 id="story-heading" className="story__title">
        {title}
      </h1>
    </header>
  );
}
