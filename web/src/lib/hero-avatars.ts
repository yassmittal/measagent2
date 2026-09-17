import type { AvatarProfile } from '@measagent/shared/avatars';

const MAX_HERO_AVATARS = 5;

/**
 * The avatars the front page's portrait cycles through. A photo is what makes
 * the point of the product at a glance, so only avatars with one take part,
 * people ahead of projects; the directory's own order decides the rest. With
 * no photos at all, the first avatar still stands in on its placeholder.
 */
export function pickHeroAvatars(avatars: AvatarProfile[]): AvatarProfile[] {
  const withPhotos = avatars.filter((avatar) => avatar.pictureUrl !== null);
  const people = withPhotos.filter((avatar) => avatar.subject === 'person');
  const projects = withPhotos.filter((avatar) => avatar.subject !== 'person');
  const picked = [...people, ...projects].slice(0, MAX_HERO_AVATARS);

  if (picked.length > 0) return picked;
  return avatars.slice(0, 1);
}

/** How a card greets an avatar: a person by first name, a project by its name. */
export function readAvatarCallName(avatar: AvatarProfile): string {
  return avatar.subject === 'person'
    ? (avatar.name.split(' ')[0] ?? avatar.name)
    : avatar.name;
}
