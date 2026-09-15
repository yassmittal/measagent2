import type { FastifyReply, FastifyRequest } from 'fastify';
import type { WeeklySummarySettingsResponse } from '@measagent/shared/weekly-summary';
import { readWeeklySummarySettings } from '../../lib/weekly-summary/weekly-summary-settings.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/** `GET /v1/me/weekly-summary` — whether the owner gets the weekly email, and in which time zone. */
export async function loadWeeklySummarySettings(
  this: FastifyRequest['server'],
  request: FastifyRequest,
  reply: FastifyReply
): Promise<WeeklySummarySettingsResponse | undefined> {
  const ownerId = readSessionOwnerId(request);
  if (ownerId === null) {
    return reply.unauthorized('Not signed in');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const [owner, avatar] = await Promise.all([
    usersCollection(db).findOne({ _id: ownerId }),
    avatarsCollection(db).findOne({ ownerId }),
  ]);
  if (owner === null) {
    return reply.unauthorized('That account no longer exists');
  }
  if (avatar === null) {
    return reply.notFound('You have not launched an avatar yet');
  }

  return { settings: readWeeklySummarySettings(owner) };
}
