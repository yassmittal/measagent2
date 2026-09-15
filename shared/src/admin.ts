import type { AvatarListing, OwnAvatar } from './avatars.js';

/** Imported as `@measagent/shared/admin`. Types only, so the `.js` import is erased. */

export interface AdminSignInRequest {
  username: string;
  password: string;
}

export interface AdminSessionResponse {
  sessionToken: string;
  sessionExpiresAt: string;
}

/** Everything a reviewer needs to decide on an avatar, the owner's email included. */
export interface AvatarForReview extends OwnAvatar {
  ownerEmail: string;
  listingReviewedAt: string | null;
}

export interface AvatarsForReviewQuery {
  listing: AvatarListing;
}

export interface AvatarsForReviewResponse {
  avatars: AvatarForReview[];
}

/** A review decides whether an avatar is listed; putting it back to pending is the owner's edit, not a review. */
export interface ReviewAvatarRequest {
  listing: Exclude<AvatarListing, 'pending'>;
}

export interface ReviewAvatarResponse {
  avatar: AvatarForReview;
}
