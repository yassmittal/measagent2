import { Mic } from 'lucide-react';

export function PushToTalkBar() {
  const label = 'Voice input is not available yet';

  return (
    <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
      <Mic size={18} strokeWidth={1.8} aria-hidden="true" />
      <span className="ptt-bar-label">{label}</span>
    </button>
  );
}
