import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GoogleSignInRequest, SignInResponse } from '@measagent/shared';
import type { Db } from 'mongodb';
import { toAccountOwnerId } from '../../lib/auth/owner-id.js';
import { toUserProfile } from '../../lib/auth/user-profile.js';
import { claimDeviceThreadsForAccount } from '../../lib/chat/thread-ownership.js';
import {
  type GoogleIdentity,
  verifyGoogleIdToken,
} from '../../services/google-identity.js';
import { usersCollection } from '../../shared/collections.js';
import { CONSENT_TERMS_VERSION, SESSION_LIFETIME_DAYS } from '../../shared/constants.js';
import type { UserDoc } from '../../shared/documents.js';
import { getErrorMessage } from '../../shared/errors.js';
import { readDeviceOwnerId } from '../../shared/identity.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `POST /v1/auth/google` — trade a Google credential for a session of our own.
 *
 * The Google token is never kept. It proves who someone is once; from then on
 * the browser carries this service's own token, which says nothing except which
 * owner is calling and cannot be replayed against Google.
 */
export async function signInWithGoogle(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: GoogleSignInRequest }>,
  reply: FastifyReply
): Promise<SignInResponse | undefined> {
  const { MA_GOOGLE_CLIENT_ID: googleClientId, MA_SESSION_SECRET: sessionSecret } =
    this.config;

  if (googleClientId === '' || sessionSecret === '') {
    return reply.serviceUnavailable('Sign-in is not configured');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  let identity: GoogleIdentity;
  try {
    identity = await verifyGoogleIdToken(request.body.idToken, googleClientId);
  } catch (error) {
    this.log.warn({ err: getErrorMessage(error) }, 'Rejected a Google credential');
    return reply.unauthorized('That Google sign-in could not be verified');
  }

  const user = await recordSignIn(db, identity);

  // The browser still knows the device it chatted as, so anything it started
  // anonymously moves onto the account now — before the token it is about to
  // receive makes it stop sending that device id as its owner.
  const deviceOwnerId = readDeviceOwnerId(request);
  const claimedThreadCount =
    deviceOwnerId === null
      ? 0
      : await claimDeviceThreadsForAccount(db, deviceOwnerId, user._id);

  return {
    sessionToken: this.jwt.sign({ sub: user._id }),
    sessionExpiresAt: new Date(
      Date.now() + SESSION_LIFETIME_DAYS * MILLISECONDS_PER_DAY
    ).toISOString(),
    user: toUserProfile(user, CONSENT_TERMS_VERSION),
    claimedThreadCount,
  };
}

/**
 * Create the account on first sign-in, refresh the profile on every later one —
 * a name or a photo changed in Google should not need a second code path.
 */
async function recordSignIn(db: Db, identity: GoogleIdentity): Promise<UserDoc> {
  const now = new Date();
  const user = await usersCollection(db).findOneAndUpdate(
    { _id: toAccountOwnerId(identity.subject) },
    {
      $set: {
        email: identity.email,
        name: identity.name,
        pictureUrl: identity.pictureUrl,
        lastSignedInAt: now,
      },
      $setOnInsert: {
        googleSubject: identity.subject,
        createdAt: now,
        consent: null,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  if (user === null) throw new Error('Sign-in wrote no user document');
  return user;
}
