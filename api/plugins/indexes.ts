import fp from 'fastify-plugin';
import {
  avatarsCollection,
  messagesCollection,
  threadsCollection,
} from '../shared/collections.js';
import { getErrorMessage } from '../shared/errors.js';

/**
 * Index creation is idempotent, so it runs at boot rather than living in a
 * migration script that someone forgets to apply to a new Atlas cluster.
 * A failure here is logged and swallowed: missing indexes make the service
 * slow, not wrong, and refusing to boot over them would be worse.
 */
export default fp(
  async (fastify) => {
    const db = fastify.mongo.db;
    if (db === undefined) return;

    try {
      await threadsCollection(db).createIndex({ userId: 1, avatarId: 1, lastMessageAt: -1 });
      await messagesCollection(db).createIndex({ threadId: 1, createdAt: 1 });
      // Both unique indexes are rules, not just speed: one avatar per account,
      // and a handle — which is a public URL — belongs to exactly one avatar.
      await avatarsCollection(db).createIndex({ ownerId: 1 }, { unique: true });
      await avatarsCollection(db).createIndex({ handle: 1 }, { unique: true });
    } catch (error) {
      fastify.log.warn(
        { err: getErrorMessage(error) },
        'Failed to ensure MongoDB indexes'
      );
    }
  },
  { name: 'indexes', dependencies: ['mongodb'] }
);
