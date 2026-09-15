import type { OwnAvatar, UpdateOwnAvatarRequest } from '@measagent/shared/avatars';
import type { AvatarDoc, UserDoc } from '../../shared/documents.js';

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
    availability: avatar.availability,
    listing: avatar.listing,
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
    | 'availability'
    | 'listing'
    | 'listingReviewedAt'
    | 'updatedAt'
  >
>;

/**
 * Turn an owner's edit into the fields to write.
 *
 * A changed bio goes back to review, because the bio is the one thing the
 * directory shows: without this an approved avatar could be listed and then
 * rewritten into anything. The fields only the model reads do not reset the
 * review, and neither does re-saving an unchanged bio.
 */
export function buildOwnAvatarChanges(
  current: AvatarDoc,
  request: UpdateOwnAvatarRequest,
  now: Date
): AvatarChanges {
  const changes: AvatarChanges = { updatedAt: now };

  if (request.aboutMe !== undefined) changes.aboutMe = request.aboutMe.trim();
  if (request.speakingStyle !== undefined) {
    changes.speakingStyle = request.speakingStyle.trim();
  }
  if (request.avoidTopics !== undefined) changes.avoidTopics = request.avoidTopics.trim();
  if (request.availability !== undefined) changes.availability = request.availability;

  const bio = request.bio?.trim();
  if (bio !== undefined && bio !== current.bio) {
    changes.bio = bio;
    changes.listing = 'pending';
    changes.listingReviewedAt = null;
  }

  return changes;
}
