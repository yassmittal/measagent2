import type { AvatarProfile } from '@measagent/shared/avatars';
import { truncateForDescription } from './page-metadata';

/**
 * Below this, a page is a name and a line — thin enough that hundreds of them
 * could make search engines think less of the whole site.
 */
const MINIMUM_INDEXABLE_BIO_LENGTH = 60;

function hasEnoughToIndex(avatar: AvatarProfile): boolean {
  return (
    avatar.bio.trim().length >= MINIMUM_INDEXABLE_BIO_LENGTH ||
    avatar.askMeAbout.length > 0
  );
}

/**
 * Whether an avatar's page goes to search engines: the api's answer (listed,
 * live, not hidden by the owner) and enough on the page to be worth a result.
 * The sitemap and the page's robots tag both ask this, so they cannot disagree.
 */
export function shouldIndexAvatarPage(avatar: AvatarProfile): boolean {
  return avatar.isSearchIndexable && hasEnoughToIndex(avatar);
}

/**
 * Room for the name inside a 60-character title, once "Talk to …'s AI avatar"
 * and the " | meAsAgent" template are around it. Longer names are cut rather
 * than letting the search result cut the brand.
 */
const MAX_TITLE_NAME_LENGTH = 28;

export function buildAvatarPageTitle(avatar: AvatarProfile): string {
  const nameCharacters = Array.from(avatar.name);
  const titleName =
    nameCharacters.length <= MAX_TITLE_NAME_LENGTH
      ? avatar.name
      : `${nameCharacters
          .slice(0, MAX_TITLE_NAME_LENGTH - 1)
          .join('')
          .trimEnd()}…`;
  return `Talk to ${titleName}'s AI avatar`;
}

export function buildAvatarPageDescription(avatar: AvatarProfile): string {
  return truncateForDescription(`${avatar.name}'s AI avatar. ${avatar.bio}`);
}
