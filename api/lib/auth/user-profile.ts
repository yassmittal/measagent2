import type { UserProfile } from '@measagent/shared';
import type { UserDoc } from '../../shared/documents.js';

/**
 * The one place that decides whether someone has accepted the terms. Launching
 * an avatar and being remembered both depend on it, so no call site gets to read
 * the consent field its own way.
 */
export function hasAcceptedTerms(user: UserDoc): boolean {
  return user.consent !== null;
}

export function toUserProfile(doc: UserDoc): UserProfile {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    pictureUrl: doc.pictureUrl,
    consentAcceptedAt: doc.consent?.acceptedAt.toISOString() ?? null,
  };
}
