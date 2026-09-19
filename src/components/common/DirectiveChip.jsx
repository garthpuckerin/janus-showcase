import { Zap, MessageCircle, HelpCircle } from 'lucide-react';

/* Colour is never the only signal: each directive also carries a distinct
   icon and a text label. */
const DIRECTIVE_META = {
  ACTIVATE_SHARD: { label: 'Activate shard', icon: Zap, className: 'directive-chip--activate-shard' },
  ADVISE: { label: 'Advise', icon: MessageCircle, className: 'directive-chip--advise' },
  REQUEST_INPUT: { label: 'Request input', icon: HelpCircle, className: 'directive-chip--request-input' },
};

export function DirectiveChip({ type }) {
  const meta = DIRECTIVE_META[type];
  if (!meta) return <span className="directive-chip">{type}</span>;
  const Icon = meta.icon;
  return (
    <span className={`directive-chip ${meta.className}`}>
      <Icon size={14} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
