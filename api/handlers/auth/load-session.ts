import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SessionResponse } from '@measagent/shared';
import { toUserProfile } from '../../lib/auth/user-profile.js';
import { usersCollection } from '../../shared/collections.js';
import { CONSENT_TERMS_VERSION } from '../../shared/constants.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/**
 * `GET /v1/auth/session` — who the bearer of this token is.
 *
 * The browser calls this on load rather than trusting the profile it cached
 * alongside the token, so a token that has expired, or an account that has been
 * deleted, signs the tab out instead of leaving a stale name on screen.
 */
export async function loadSession(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<SessionResponse | undefined> {
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

  return { user: toUserProfile(user, CONSENT_TERMS_VERSION) };
}
