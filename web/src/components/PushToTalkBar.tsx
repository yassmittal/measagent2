import { MicrophoneIcon } from './icons';

export function PushToTalkBar() {
  const label = 'Voice input is not available yet';

  return (
    <button type="button" className="ptt-bar" aria-label={label} title={label} disabled>
      <MicrophoneIcon />
      <span className="ptt-bar-label">{label}</span>
    </button>
  );
}
