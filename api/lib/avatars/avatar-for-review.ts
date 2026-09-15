import type { AvatarForReview } from '@measagent/shared/admin';
import type { AvatarWithOwner } from './avatar-with-owner.js';
import { toOwnAvatar } from './own-avatar.js';

/** The owner's own view plus what a reviewer needs to reach them. */
export function toAvatarForReview({ avatar, owner }: AvatarWithOwner): AvatarForReview {
  return {
    ...toOwnAvatar(avatar, owner),
    ownerEmail: owner.email,
    listingReviewedAt: avatar.listingReviewedAt?.toISOString() ?? null,
  };
}
