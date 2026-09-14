import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ConsentResponse } from '@measagent/shared';
import { usersCollection } from '../../shared/collections.js';
import { CONSENT_TERMS_VERSION } from '../../shared/constants.js';
import { readSessionOwnerId } from '../../shared/identity.js';

export async function acceptConsent(
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

  const acceptedAt = new Date();
  const result = await usersCollection(db).updateOne(
    { _id: ownerId },
    { $set: { consent: { acceptedAt, termsVersion: CONSENT_TERMS_VERSION } } }
  );

  if (result.matchedCount === 0) {
    return reply.unauthorized('That account no longer exists');
  }

  return { consentAcceptedAt: acceptedAt.toISOString() };
}
