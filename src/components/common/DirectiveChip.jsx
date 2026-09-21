import { Zap, MessageCircle, HelpCircle } from 'lucide-react';

/* Fixed semantics (docs/DESIGN-SYSTEM.md): the three directives are the
 * product's vocabulary. ACTIVATE_SHARD is positive, REQUEST_INPUT is
 * warning, ADVISE is neutral — advice is the absence of action, not
 * info-blue. Colour is never the only signal: each directive also carries a
 * distinct icon and the verbatim protocol spelling as its visible text. */
const DIRECTIVE_META = {
  ACTIVATE_SHARD: { icon: Zap, className: 'directive-chip--activate-shard' },
  ADVISE: { icon: MessageCircle, className: 'directive-chip--advise' },
  REQUEST_INPUT: { icon: HelpCircle, className: 'directive-chip--request-input' },
};

export function DirectiveChip({ type }) {
  const meta = DIRECTIVE_META[type];
  if (!meta) return <span className="directive-chip">{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={`directive-chip ${meta.className}`}>
      <Icon size={14} aria-hidden="true" />
      {type}
    </span>
  );
}
