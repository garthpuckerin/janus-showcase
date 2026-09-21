import { DirectiveChip } from '../../common/DirectiveChip.jsx';

/** The verdict row: the directive chip, then `storyModel.js`'s segments in
 *  order, with every `code` segment in mono — never a hand-typed identifier. */
export function StoryVerdictLine({ segments, directiveType }) {
  return (
    <div className="story__verdict-row">
      {directiveType && <DirectiveChip type={directiveType} />}
      <p className="story__verdict">
        {segments.map((segment, index) =>
          segment.type === 'code' ? (
            <code key={index}>{segment.value}</code>
          ) : (
            <span key={index}>{segment.value}</span>
          ),
        )}
      </p>
    </div>
  );
}
