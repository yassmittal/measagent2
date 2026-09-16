import type { AvatarProfile } from '@measagent/shared/avatars';

/**
 * The avatar the front page invites a visitor to ask straight away. A person
 * with a photo makes the point of the product at a glance, so one is preferred;
 * otherwise the directory's own order decides. Never a hardcoded handle.
 */
export function pickFeaturedAvatar(avatars: AvatarProfile[]): AvatarProfile | null {
  return (
    avatars.find((avatar) => avatar.subject === 'person' && avatar.pictureUrl !== null) ??
    avatars.find((avatar) => avatar.pictureUrl !== null) ??
    avatars[0] ??
    null
  );
}
