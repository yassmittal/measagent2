import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  UpdateWeeklySummarySettingsRequest,
  WeeklySummarySettingsResponse,
} from '@measagent/shared/weekly-summary';
import { isValidTimeZone } from '../../lib/weekly-summary/summary-week.js';
import { readWeeklySummarySettings } from '../../lib/weekly-summary/weekly-summary-settings.js';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import { readSessionOwnerId } from '../../shared/identity.js';

/**
 * `PATCH /v1/me/weekly-summary` — turn the weekly email on or off, or record the
 * owner's time zone, which the visitors page sends from the browser.
 */
export async function updateWeeklySummarySettings(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: UpdateWeeklySummarySettingsRequest }>,
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

  const { isEnabled, timeZone } = request.body;
  if (timeZone !== undefined && !isValidTimeZone(timeZone)) {
    return reply.badRequest('`timeZone` is not a time zone this service knows');
  }

  const avatar = await avatarsCollection(db).findOne({ ownerId });
  if (avatar === null) {
    return reply.notFound('You have not launched an avatar yet');
  }

  const owner = await usersCollection(db).findOneAndUpdate(
    { _id: ownerId },
    {
      $set: {
        ...(isEnabled !== undefined ? { 'weeklySummary.isEnabled': isEnabled } : {}),
        ...(timeZone !== undefined ? { 'weeklySummary.timeZone': timeZone } : {}),
      },
    },
    { returnDocument: 'after' }
  );
  if (owner === null) {
    return reply.unauthorized('That account no longer exists');
  }

  return { settings: readWeeklySummarySettings(owner) };
}
