import type { FastifyReply, FastifyRequest } from 'fastify';
import { hasTokenPurpose, TOKEN_PURPOSE } from '../../lib/auth/token-purpose.js';
import { usersCollection } from '../../shared/collections.js';

/**
 * `POST /v1/weekly-summary/unsubscribe?token=` — stop the weekly email without
 * signing in. Called by the unsubscribe page's button and by mail clients'
 * one-click unsubscribe, never by a plain link: link scanners follow links.
 *
 * Idempotent, and it answers the same whether or not the account still exists.
 */
export async function unsubscribeWeeklySummary(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply
): Promise<void> {
  let ownerId: string | null = null;
  try {
    const claims = this.jwt.verify<{ sub?: unknown }>(request.query.token);
    if (hasTokenPurpose(claims, TOKEN_PURPOSE.weeklySummaryUnsubscribe) && typeof claims.sub === 'string') {
      ownerId = claims.sub;
    }
  } catch {
    ownerId = null;
  }
  if (ownerId === null) {
    return reply.badRequest('That unsubscribe link is not valid');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  await usersCollection(db).updateOne(
    { _id: ownerId },
    { $set: { 'weeklySummary.isEnabled': false } }
  );
  return reply.code(204).send();
}
