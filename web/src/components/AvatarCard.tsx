import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { Avatar } from './Avatar';
import { LinkPendingIndicator } from './LinkPendingIndicator';

export function AvatarCard({ avatar }: { avatar: AvatarProfile }) {
  return (
    <Link href={`/${avatar.handle}`} className="avatar-card">
      <Avatar portraitUrl={avatar.pictureUrl} size={64} />
      <span className="avatar-card-text">
        <span className="avatar-card-name">{avatar.name}</span>
        <span className="avatar-card-bio">{avatar.bio}</span>
      </span>
      <LinkPendingIndicator />
    </Link>
  );
}
