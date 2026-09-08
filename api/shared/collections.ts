import type { Collection, Db } from 'mongodb';
import type { MessageDoc, ThreadDoc } from './documents.js';

/**
 * Collection names are looked up here rather than typed at each call site, so a
 * rename is one edit and a typo is a compile error instead of a silently empty
 * result set.
 */
export const COLLECTIONS = Object.freeze({
  threads: 'threads',
  messages: 'messages',
  relationships: 'relationships',
  returnReminders: 'returnReminders',
});

export const threadsCollection = (db: Db): Collection<ThreadDoc> =>
  db.collection<ThreadDoc>(COLLECTIONS.threads);

export const messagesCollection = (db: Db): Collection<MessageDoc> =>
  db.collection<MessageDoc>(COLLECTIONS.messages);
