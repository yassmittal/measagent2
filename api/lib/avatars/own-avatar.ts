import type { OwnAvatar, UpdateOwnAvatarRequest } from '@measagent/shared/avatars';
import type { AvatarDoc, UserDoc } from '../../shared/documents.js';
import {
  haveSameTopics,
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
    | 'listingReviewedAt'
    | 'updatedAt'
  >
>;

/**
 * Turn an owner's edit into the fields to write.
 *
 * A changed bio, *Ask me about* or website goes back to review, because those
 * are what the public page shows: without this an approved avatar could be
 * listed and then rewritten into anything, or pointed at any link. The fields
 * only the model reads do not reset the review, and neither does re-saving an
 * unchanged value. Neither does the subject or the search setting — they change
 * how the page is described, not what it says.
 *
 * Expects a website URL already checked by `isAcceptableWebsiteUrl`.
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
  if (request.subject !== undefined) changes.subject = request.subject;
  if (request.isHiddenFromSearch !== undefined) {
    changes.isHiddenFromSearch = request.isHiddenFromSearch;
  }

  const currentDetails = readAvatarPublicDetails(current);
  let hasPublicTextChanged = false;

  const bio = request.bio?.trim();
  if (bio !== undefined && bio !== current.bio) {
    changes.bio = bio;
    hasPublicTextChanged = true;
  }

  if (request.askMeAbout !== undefined) {
    const askMeAbout = normalizeAskMeAboutTopics(request.askMeAbout);
    if (!haveSameTopics(currentDetails.askMeAbout, askMeAbout)) {
      changes.askMeAbout = askMeAbout;
      hasPublicTextChanged = true;
    }
  }

  if (request.websiteUrl !== undefined) {
    const websiteUrl = normalizeWebsiteUrl(request.websiteUrl);
    if (websiteUrl !== currentDetails.websiteUrl) {
      changes.websiteUrl = websiteUrl;
      hasPublicTextChanged = true;
    }
  }

  if (hasPublicTextChanged) {
    changes.listing = 'pending';
    changes.listingReviewedAt = null;
  }

  return changes;
}
