import type { OwnAvatar, UpdateOwnAvatarRequest } from '@measagent/shared/avatars';
import type { AvatarDoc, UserDoc } from '../../shared/documents.js';
import {
  isAvatarHiddenFromSearch,
  normalizeAskMeAboutTopics,
  normalizeWebsiteUrl,
  readAvatarPublicDetails,
} from './avatar-public-details.js';

export function toOwnAvatar(avatar: AvatarDoc, owner: UserDoc): OwnAvatar {
  return {
    id: avatar._id,
    handle: avatar.handle,
    name: owner.name,
    pictureUrl: owner.pictureUrl,
    bio: avatar.bio,
    aboutMe: avatar.aboutMe,
    speakingStyle: avatar.speakingStyle,
    avoidTopics: avatar.avoidTopics,
    ...readAvatarPublicDetails(avatar),
    availability: avatar.availability,
    listing: avatar.listing,
    isHiddenFromSearch: isAvatarHiddenFromSearch(avatar),
    createdAt: avatar.createdAt.toISOString(),
    updatedAt: avatar.updatedAt.toISOString(),
  };
}

type AvatarChanges = Partial<
  Pick<
    AvatarDoc,
    | 'bio'
    | 'aboutMe'
    | 'speakingStyle'
    | 'avoidTopics'
    | 'subject'
    | 'askMeAbout'
    | 'websiteUrl'
    | 'isHiddenFromSearch'
    | 'availability'
    | 'listing'
    | 'updatedAt'
  >
>;

/**
 * Turn an owner's edit into the fields to write.
 *
 * Avatars are listed without review, so an edit never takes one off the
 * directory. An avatar still waiting from when review was required is listed
 * by its next edit. A declined one stays declined: that was an admin's call,
 * and an owner's edit must not undo it.
 *
 * Expects a website URL already checked by `isAcceptableWebsiteUrl`.
 */
export function buildOwnAvatarChanges(
  current: AvatarDoc,
  request: UpdateOwnAvatarRequest,
  now: Date
): AvatarChanges {
  const changes: AvatarChanges = { updatedAt: now };

  if (request.bio !== undefined) changes.bio = request.bio.trim();
  if (request.aboutMe !== undefined) changes.aboutMe = request.aboutMe.trim();
  if (request.speakingStyle !== undefined) {
    changes.speakingStyle = request.speakingStyle.trim();
  }
  if (request.avoidTopics !== undefined) changes.avoidTopics = request.avoidTopics.trim();
  if (request.subject !== undefined) changes.subject = request.subject;
  if (request.askMeAbout !== undefined) {
    changes.askMeAbout = normalizeAskMeAboutTopics(request.askMeAbout);
  }
  if (request.websiteUrl !== undefined) {
    changes.websiteUrl = normalizeWebsiteUrl(request.websiteUrl);
  }
  if (request.isHiddenFromSearch !== undefined) {
    changes.isHiddenFromSearch = request.isHiddenFromSearch;
  }
  if (request.availability !== undefined) changes.availability = request.availability;

  if (current.listing === 'pending') changes.listing = 'listed';

  return changes;
}
