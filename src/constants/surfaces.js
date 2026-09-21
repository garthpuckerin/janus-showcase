/* Companion-shell constants: the four bottom-tab destinations, in bar
 * order, and the routes that only make sense at workstation width. Kept
 * separate from component files so both the shell and the sweep script can
 * import the same list without a component dependency. */

/** The phone companion's bottom-tab destinations, in bar order. "more"
 *  opens the sheet rather than navigating directly. */
export const COMPANION_TABS = Object.freeze(['attention', 'decisions', 'advisor', 'more']);

/** Routes that stay at the desk: reaching one on the companion renders the
 *  shared `DeskOnlyState` instead of the real view. */
export const DESK_ONLY_VIEWS = Object.freeze(['policies', 'boundary']);
