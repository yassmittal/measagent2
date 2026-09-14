import type { UserProfile } from '@measagent/shared';
import type { UserDoc } from '../../shared/documents.js';

export function toUserProfile(doc: UserDoc, currentTermsVersion: string): UserProfile {
  const consent = doc.consent?.termsVersion === currentTermsVersion ? doc.consent : null;

  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    pictureUrl: doc.pictureUrl,
    consentAcceptedAt: consent?.acceptedAt.toISOString() ?? null,
  };
}
