import { PERSONA_BIO, PERSONA_NAME } from '@/lib/persona';
import { Avatar } from './Avatar';

export function AvatarPanel() {
  return (
    <aside className="avatar-panel">
      <Avatar label={PERSONA_NAME} />
      <div className="avatar-panel-id">
        <span className="avatar-panel-name">{PERSONA_NAME}</span>
        <p className="avatar-panel-bio">{PERSONA_BIO}</p>
      </div>
    </aside>
  );
}
