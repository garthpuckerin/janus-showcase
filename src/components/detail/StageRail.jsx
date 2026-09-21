/** The six-segment stage-rail header (docs/DESIGN-SYSTEM.md "Stage rail"):
 *  each segment is a mono two-digit index, a sans title and a mono status
 *  line, all read off `stages` (the `stageStates()` output) — never typed
 *  here. Segments are anchor links that scroll to the matching section. */
export function StageRail({ stages }) {
  return (
    <nav className="stage-rail" aria-label="Decision stage rail">
      <ol className="stage-rail__list">
        {stages.map((stage, index) => (
          <li key={stage.key} className={`stage-rail__segment stage-rail__segment--${stage.state}`}>
            <a href={`#stage-${stage.key}`} className="stage-rail__link">
              <span className="stage-rail__index">{String(index + 1).padStart(2, '0')}</span>
              <span className="stage-rail__title">{stage.title}</span>
              <span className="stage-rail__status">{stage.status}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
