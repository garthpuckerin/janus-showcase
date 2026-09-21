/**
 * No re-run controls on the phone: one line, and a way to this same decision
 * on the desktop layout. The handler comes from `CompanionShell`, which owns
 * both halves of the move — put the decision on the workstation's route, then
 * switch the shell in place. The first version called `location.assign` here,
 * a full reload that threw away in-memory state; the white-glove sweep caught
 * it once it learned to tell a real `load` from a layout switch (2026-09-21).
 */
export function StoryDeskLink({ onOpenDesktop }) {
  return (
    <div className="story-rerun">
      <p className="page-framing">Re-running a request against a different caller is a workstation action.</p>
      <button type="button" className="button button--ghost" onClick={onOpenDesktop}>
        Open the desktop layout
      </button>
    </div>
  );
}
