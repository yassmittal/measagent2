import fp from 'fastify-plugin';
import { messagesCollection, threadsCollection } from '../shared/collections.js';
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
      await threadsCollection(db).createIndex({ userId: 1, lastMessageAt: -1 });
      await messagesCollection(db).createIndex({ threadId: 1, createdAt: 1 });
    } catch (error) {
      fastify.log.warn(
        { err: getErrorMessage(error) },
        'Failed to ensure MongoDB indexes'
      );
    }
  },
  { name: 'indexes', dependencies: ['mongodb'] }
);
