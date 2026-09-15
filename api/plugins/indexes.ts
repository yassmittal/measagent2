import fp from 'fastify-plugin';
import {
  avatarsCollection,
  messagesCollection,
  relationshipsCollection,
  returnRemindersCollection,
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
      // Unique for the same reason: two first turns racing each other must not
      // leave a visitor with two memories of the same avatar.
      await relationshipsCollection(db).createIndex(
        { userId: 1, avatarId: 1 },
        { unique: true }
      );
      await relationshipsCollection(db).createIndex({ memoryDueAt: 1 });
      await relationshipsCollection(db).createIndex({ reminderDueAt: 1 });
      // One pending reminder per visitor per avatar, enforced here rather than
      // by a read-then-insert that two instances could both pass.
      await returnRemindersCollection(db).createIndex(
        { userId: 1, avatarId: 1 },
        { unique: true, partialFilterExpression: { deliveredAt: null }, name: 'one_pending_per_pair' }
      );
      await returnRemindersCollection(db).createIndex({ userId: 1, deliveredAt: 1 });
    } catch (error) {
      fastify.log.warn(
        { err: getErrorMessage(error) },
        'Failed to ensure MongoDB indexes'
      );
    }
  },
  { name: 'indexes', dependencies: ['mongodb'] }
);
