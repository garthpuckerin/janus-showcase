import { Zap, MessageCircle, HelpCircle } from 'lucide-react';

/* Fixed semantics (docs/DESIGN-SYSTEM.md): the three directives are the
 * product's vocabulary. ACTIVATE_SHARD is positive, REQUEST_INPUT is
 * warning, ADVISE is neutral — advice is the absence of action, not
 * info-blue. Colour is never the only signal: each directive also carries a
 * distinct icon and the verbatim protocol spelling as its visible text. */
/* Styled by the shared `.chip` family in components.css — never by a screen
 * stylesheet. (Its rules once lived in decisions.css; a rewrite of that screen
 * deleted them and the chip rendered as bare text on every screen, which no
 * overflow sweep can see. tests/orphanClasses.test.js now catches that.) */
const DIRECTIVE_META = {
  ACTIVATE_SHARD: { icon: Zap, className: 'chip--positive' },
  ADVISE: { icon: MessageCircle, className: 'chip--neutral' },
  REQUEST_INPUT: { icon: HelpCircle, className: 'chip--warning' },
};

export function DirectiveChip({ type }) {
  const meta = DIRECTIVE_META[type];
  if (!meta) return <span className="chip chip--neutral directive-chip">{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={`chip directive-chip ${meta.className}`}>
      <Icon size={14} aria-hidden="true" />
      {type}
    </span>
  );
}
