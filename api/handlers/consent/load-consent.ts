import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ConsentResponse } from '@measagent/shared';
import { toUserProfile } from '../../lib/auth/user-profile.js';
import { usersCollection } from '../../shared/collections.js';
import { CONSENT_TERMS_VERSION } from '../../shared/constants.js';
import { readSessionOwnerId } from '../../shared/identity.js';

export async function loadConsent(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<ConsentResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const user = await usersCollection(db).findOne({ _id: ownerId });
  if (user === null) {
    return reply.unauthorized('That account no longer exists');
  }

  return { consentAcceptedAt: toUserProfile(user, CONSENT_TERMS_VERSION).consentAcceptedAt };
}
